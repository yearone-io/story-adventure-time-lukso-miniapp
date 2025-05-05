import { CreateFormData } from "@/types/create";
import { generateLSP4JSON, Image } from "@lukso/lsp-utils";
import { hashData } from "@erc725/erc725.js/build/main/src/lib/utils";
import { fetchImageBytes } from "@/utils/interfaceDetection";
import { pinJsonToIpfs } from "@/services/ipfs";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import AdventureTimeContractABI from "../contracts/AdventureTime.json"
import { createPublicClient, createWalletClient } from "viem";
import StoryLineABIFile from '../contracts/StoryLineABI.json';

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
  if (data.iconIpfsHash) {
    icons.push(
      await processImageData(
        ipfsGateway,
        data.iconIpfsHash,
        data.iconWidth!,
        data.iconHeight!
      )
    );
  }
  if (data.imageIpfsHash) {
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
    [
      {
        key: "author",
        value: data.author,
        type: "string"
      },
      {
        key: "createdAt",
        value: data.createdAt.toString(),
        type: "number"
      }
    ],
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

export const mintStory = async (
  client: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  connectedAddress: `0x${string}`,
  adventureTimeContractAddress: `0x${string}`,
  ipfsGateway: string,
  data: CreateFormData
): Promise<string | null> => {

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

  const hash = await client.writeContract({
    address: adventureTimeContractAddress,
    abi: AdventureTimeContractABI,
    functionName: "mint",
    args: [
      data.title, //storylineName
      "ADV", //storylineSymbol
      connectedAddress, //vibeMaster add
      false, //isFollowerRestrictionEnabled
      curatedListEncodeMetadata.values[0], //lsp4MetadataURIOfStoryline
      curatedListEncodeMetadata.values[0], //lsp4MetadataURIOfStartingPrompt
      "0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA", //followerSystemContract
    ],
    account: connectedAddress,
    chain: client.chain
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return hash; //TODO
};

export const mintStoryLine = async (
  client: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  connectedAddress: `0x${string}`,
  storyLineContractAddress: `0x${string}`,
  ipfsGateway: string,
  data: CreateFormData
): Promise<string | null> => {

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

  const hash = await client.writeContract({
    address: storyLineContractAddress,
    abi: StoryLineABIFile,
    functionName: "mint",
    args: [
      curatedListEncodeMetadata.values[0],
    ],
    account: connectedAddress,
    chain: client.chain
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
};
