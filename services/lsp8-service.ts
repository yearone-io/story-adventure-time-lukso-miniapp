import { CreateFormData } from "@/types/create";
import { generateLSP4JSON, Image } from "@lukso/lsp-utils";
import { hashData } from "@erc725/erc725.js/build/main/src/lib/utils";
import { fetchImageBytes } from "@/utils/interfaceDetection";
import { pinJsonToIpfs } from "@/services/ipfs";
import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import AdventureTimeContractABI from "../contracts/AdventureTime.json";
import StoryLineABIFile from '../contracts/StoryLineABI.json';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { createPublicClient, createWalletClient, getAddress, keccak256, toHex } from "viem";
import { INTERFACE_IDS } from '@lukso/lsp-smart-contracts/constants';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json' assert { type: 'json' };
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { Interface } from '@ethersproject/abi'; // For event parsing

// Convert an address to its checksum format
export function getChecksumAddress(address: string): string {
  try {
    return getAddress(address);
  } catch (error) {
    throw new Error(`Invalid address: ${address}`);
  }
}

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

export const mintStoryline = async (
  client: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  connectedAddress: `0x${string}`, // Universal Profile address
  adventureTimeContractAddress: `0x${string}`,
  ipfsGateway: string,
  data: CreateFormData
): Promise<string | null> => {
  try {
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

    // Call the mint function directly on the AdventureTime contract
    const hash = await client.writeContract({
      address: adventureTimeContractAddress,
      abi: AdventureTimeContractABI,
      functionName: "mint",
      args: [
        data.title, // storylineName
        "ADV", // storylineSymbol
        connectedAddress, // vibeMaster address (UP address)
        false, // isFollowerRestrictionEnabled
        curatedListEncodeMetadata.values[0], // lsp4MetadataURIOfStoryline
        curatedListEncodeMetadata.values[0], // lsp4MetadataURIOfStartingPrompt
        "0xf01103E5a9909Fc0DBe8166dA7085e0285daDDcA", // followerSystemContract
      ],
      account: connectedAddress,
      chain: client.chain,
    });

    // Wait for transaction confirmation and get receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction receipt:', {
      status: receipt.status,
      transactionHash: receipt.transactionHash,
      logs: receipt.logs.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
      })),
    });

    // Calculate the StorylineCreated event topic
    const eventSignature = 'StorylineCreated(string,address,address)';
    const eventTopic = keccak256(toHex(eventSignature));
    console.log('Expected StorylineCreated topic:', eventTopic);

    // Check if any log matches the event topic
    const matchingLogs = receipt.logs.filter(log => log.topics[0] === eventTopic);
    console.log('Logs matching StorylineCreated topic:', matchingLogs);

    // Parse the StorylineCreated event
    let storylineAddress: string | null = null;

    try {
      const iface = new Interface(AdventureTimeContractABI);
      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsedLog && parsedLog.name === 'StorylineCreated') {
            storylineAddress = parsedLog.args.storylineAddress;
            console.log('StorylineCreated:', parsedLog.args);
            break;
          }
        } catch (error) {
        }
      }
    } catch (error) {
      console.error('Interface error:', error);
    }

    if (!storylineAddress) {
      throw new Error('Failed to find StorylineCreated event in transaction receipt');
    }

    return getChecksumAddress(storylineAddress);
  } catch (error) {
    console.error('Error minting story:', error);
    return null;
  }
};

export const mintStorylinePrompt = async (
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

// Register a storyline to the UP's LSP12IssuedAssets[]
export const registerLSP8Collection = async (
  client: ReturnType<typeof createWalletClient>,
  publicClient: ReturnType<typeof createPublicClient>,
  upAddress: `0x${string}`, // Universal Profile address
  storylineAddress: `0x${string}`, // LSP8 collection address to register
  ipfsGateway: string // For ERC725.js
): Promise<string | null> => {
  try {
    // Initialize ERC725.js with LSP12 schema
    const erc725js = new ERC725(
      lsp3ProfileSchema as ERC725JSONSchema[],
      upAddress,
      publicClient.transport, // Use Viem's transport as provider
      { ipfsGateway }
    );

    // Fetch current LSP12IssuedAssets[]
    const issuedAssetsData = await erc725js.fetchData('LSP12IssuedAssets[]');
    let issuedAssets = (issuedAssetsData.value || []) as string[];
    issuedAssets = issuedAssets.map(asset => asset.toLowerCase());

    // Check if storylineAddress is already registered
    const checksumStorylineAddress = getChecksumAddress(storylineAddress);
    const lowercaseStorylineAddress = checksumStorylineAddress.toLowerCase();
    if (issuedAssets.includes(lowercaseStorylineAddress)) {
      console.log('Storyline already registered in LSP12IssuedAssets[]');
      return null; // No update needed
    }

    // Prepare new asset data
    const newAssets = [checksumStorylineAddress];
    const newIssuedAssetMap = [
      {
        keyName: 'LSP12IssuedAssetsMap:<address>',
        dynamicKeyParts: newAssets,
        value: [
          INTERFACE_IDS.LSP8IdentifiableDigitalAsset, // Interface ID
          ERC725.encodeValueType('uint128', issuedAssets.length), // Array index
        ],
      },
    ];

    // Encode data for LSP12IssuedAssets[] and LSP12IssuedAssetsMap
    const { keys: lsp12DataKeys, values: lsp12Values } = erc725js.encodeData([
      {
        keyName: 'LSP12IssuedAssets[]',
        value: newAssets,
        startingIndex: issuedAssets.length,
        totalArrayLength: issuedAssets.length + newAssets.length,
      },
      ...newIssuedAssetMap,
    ]);

    // Call setDataBatch directly on the Universal Profile
    const hash = await client.writeContract({
      address: upAddress,
      abi: UniversalProfile.abi,
      functionName: 'setDataBatch',
      args: [lsp12DataKeys, lsp12Values],
      account: upAddress,
      chain: client.chain,
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return hash;
  } catch (error) {
    console.error('Error registering story:', error);
    return null;
  }
};