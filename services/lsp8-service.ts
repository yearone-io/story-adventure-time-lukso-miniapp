import { CreateFormData } from "@/types/create";
import { generateLSP4JSON, Image } from "@lukso/lsp-utils";
import { hashData } from "@erc725/erc725.js/build/main/src/lib/utils";
import { fetchImageBytes } from "@/utils/interfaceDetection";
import { ethers } from "ethers";
import { pinJsonToIpfs } from "@/services/ipfs";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';

async function processImageData(
  ipfsGateway: string,
  imageIpfsHash: string,
  imageWidth: number,
  imageHeight: number
): Promise<Image> {
  const verificationMethod = 'keccak256(bytes)';
  const ipfsUrl = `ipfs://${imageIpfsHash}`;
  const imageBytes = await fetchImageBytes(ipfsGateway, ipfsUrl);
  const imageHash = hashData(imageBytes, verificationMethod);
  return {
    width: imageWidth,
    height: imageHeight,
    url: ipfsUrl,
    verification: {
      method: verificationMethod,
      data: imageHash,
    },
  };
}

async function createMetadata(
  data: CreateFormData,
  ipfsGateway: string
): Promise<string> {
  const icons: Image[] = [];
  const images: Image[] = [];
  if (data.icon && data.iconIpfsHash) {
    icons.push(
      await processImageData(
        ipfsGateway,
        data.iconIpfsHash,
        data.iconWidth!,
        data.iconHeight!
      )
    );
  }
  if (data.image && data.imageIpfsHash) {
    images.push(
      await processImageData(
        ipfsGateway,
        data.imageIpfsHash,
        data.imageWidth!,
        data.imageHeight!
      )
    );
  }
  return generateLSP4JSON(
    data.title,
    data.description,
    data.urls,
    [],
    {
      lsp7icons: [],
      lsp8icons: [],
      icons: icons,
    },
    {
      imageFields: [
        {
          lsp8images: [],
          lsp7images: [],
          images: images,
        },
      ],
    },
    {
      assets: [],
      lsp8assets: [],
      lsp7assets: [],
    }
  );
}

export const mintStoryLine = async (
  provider: ethers.BrowserProvider,
  hashlistsContractAddress: string,
  ipfsGateway: string,
  data: CreateFormData
): Promise<string | null> => {
  const signer = await provider?.getSigner();
  const adventureTimeContract = new ethers.Contract(
    hashlistsContractAddress,
    AdventureTimeContractABI,
    signer
  );
  const metadata = await createMetadata(data, ipfsGateway);
  const lsp8CollectionMetadataIpfsHash = await pinJsonToIpfs(metadata);
  console.log('✨ Minting new NFT...', lsp8CollectionMetadataIpfsHash);
  const curatedListEncodeMetadata = ERC725.encodeData(
    [
      {
        keyName: 'LSP4Metadata',
        value: {
          json: JSON.parse(metadata),
          url: `ipfs://${lsp8CollectionMetadataIpfsHash}`,
        },
      },
    ],
    LSP4DigitalAssetSchema
  );
  const tx = await adventureTimeContract.mint(
    data.title,
    signer,
    curatedListEncodeMetadata.values[0]
  );
  const receipt = await tx.wait();

  const iface = new ethers.Interface(AdventureTimeContractABI);
  const curatedListCreatedEvent = receipt.logs.find((log: any) => {
    try {
      const parsedLog = iface.parseLog(log);
      return parsedLog?.name === 'CuratedListCreated';
    } catch (error) {
      return false;
    }
  });

  if (curatedListCreatedEvent) {
    console.log(
      '🎉 CuratedListCreated event found in the transaction receipt.'
    );
    const curatedListAddress = curatedListCreatedEvent.args[0];
    console.log('🪙 Curated List Collection deployed to:', curatedListAddress);
    return curatedListAddress;
  }
  return null;
};
