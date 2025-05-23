"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useUpProvider } from "@/components/upProvider";

// This would be your LLM API service
import { generatePromptImage, generateStoryOptions } from "@/services/llm-service";

// Import ABI of your deployed contract
import AdventureTimeABIFile from '../contracts/AdventureTime.json';
import StoryLineABIFile from '../contracts/StoryLineABI.json';
import ConnectWalletExplainer from "@/components/ConnectWalletExplainer";
import { supportedNetworks } from "@/config/networks";
import SwitchNetworkExplainer from "@/components/SwitchNetworkExplainer";
import StoryLine from "@/components/StoryLine";
import { StoryPrompt } from "@/types/story";
import { IoReload } from "react-icons/io5";
import { mintStoryline, mintStorylinePrompt, registerLSP8Collection } from "@/services/lsp8-service";
import { pinFileToIPFS } from "@/services/ipfs";
import ERC725 from '@erc725/erc725.js';
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";
const AdventureTimeABI = AdventureTimeABIFile;
const StoryLineABI = StoryLineABIFile;
import { ethers } from "ethers";
import { fetchLSP4Metadata } from "@/services/lsp4-service";

const lsp4MetadataSchema = [
  {
    name: 'LSP4Metadata',
    key: ERC725YDataKeys.LSP4['LSP4Metadata'],
    keyType: 'Singleton',
    valueType: 'bytes',
    valueContent: 'VerifiableURI',
  },
];

const StoryAdventure = () => {
  const { client, publicClient, accounts, contextAccounts, walletConnected, chainId, profileChainId } =
    useUpProvider();

  const profileAddress = contextAccounts[0];
  const connectedAddress = accounts.length ? accounts[0] : null;

  const [loading, setLoading] = useState(false);
  const [storyHistory, setStoryHistory] = useState<StoryPrompt[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [currentImageData, setCurrentImageData] = useState<string[]>([]);
  const [newStoryImage, setNewStoryImage] = useState<string>();
  const [createError, setCreateError] = useState<string>();
  const [imageBlobs, setImageBlobs] = useState<Blob[]>([]);
  const [initialPromptInput, setInitialPromptInput] = useState('');
  const [storyStarted, setStoryStarted] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [optionSelectionLoading, setOptionSelectionLoading] = useState(false);
  const [showConnectWalletTooltip, setShowConnectWalletTooltip] = useState(false);
  const [showSwitchNetworkTooltip, setShowSwitchNetworkTooltip] = useState(false);
  const network = supportedNetworks[profileChainId];
  const CONTRACT_ADDRESS = network.contractAddress;
  const blobUrlsRef = useRef<string[]>([]);

  const mysteriousOpenings = [
    "The note on the door simply read: 'Don't turn around.'",
    "A single candle flickered in the abandoned house, though no one had lived there for years.",
    "She woke up in an unfamiliar room, with no memory of how she got there.",
    "The clock struck midnight, and the phone began to ring—a call from someone who had died a year ago.",
    "Footsteps echoed behind me in the empty alley, but when I turned, no one was there.",
    "The old photograph had changed—someone new was standing in the background.",
    "I found a diary under my floorboards, and it was written in my handwriting… but I had never seen it before.",
    "Every night, at exactly 3:13 AM, the door to my closet creaks open.",
    "The letter was signed with my name, but I had never written it.",
    "A shadow moved across the window, but I was on the 12th floor.",
    "There was a new grave in the cemetery… with today's date on the headstone.",
    "He had been gone for five years, yet he walked into the café as if nothing had happened.",
    "A stranger on the train whispered, 'They're coming for you tonight.'",
    "The whispers in the attic grew louder every night, though I lived alone.",
    "She had seen her own reflection blink at her.",
    "The town had vanished from the map overnight, as if it had never existed.",
    "I received a text from my sister, but she had disappeared a decade ago.",
    "The radio turned on by itself, playing a song that hadn't been released yet.",
    "As I blew out my birthday candles, someone whispered, 'Make your last wish count.'",
    "The painting in the hallway had changed—now the woman's eyes were looking directly at me."
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("https://storyadventuretime.yearone.io");
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

    // revoke all blob URLs on unmount
    useEffect(() => {
      return () => {
        blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      };
    }, []);

  useEffect(() => {
    loadStoryHistory();
  }, [profileAddress, publicClient]);

  useEffect(() => {
    if (storyHistory.length > 0 && storyStarted && currentOptions.length === 0) {
      generateNextOptions();
    }
  }, [storyStarted]);

  const loadStoryHistory = async () => {
    try {
      setLoading(true);
      console.log("profile address", profileAddress);

      if (!CONTRACT_ADDRESS || !profileAddress) {
        console.warn('Loading mini-app data');
        return;
      }

      // Check if user has a story
      const existingStories = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: AdventureTimeABI,
        functionName: 'tokenIdsOf',
        args: [profileAddress],
        account: profileAddress
      }) as string[];

      if (existingStories.length > 0) {
        // Get story history from the contract
        const storyPrompts = await publicClient.readContract({
          address: existingStories[existingStories.length - 1].replace("0x000000000000000000000000", "0x") as `0x${string}`,
          abi: StoryLineABI,
          functionName: 'totalSupply',
          account: profileAddress
        });

        const tokenIds: `0x${string}`[] = [];
        const dataKeys: string[] = [];
        for (let i = 1; i <= Number(storyPrompts); i++) {
          // toString(16) gives the hex without leading zeros
          const hex = i.toString(16).padStart(64, "0");
          tokenIds.push(`0x${hex}`);
          dataKeys.push("0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e");
        }

        const storyLinesContract = existingStories[existingStories.length - 1].replace("0x000000000000000000000000", "0x") as `0x${string}`;
        const storyLines = await publicClient.readContract({
          address: storyLinesContract,
          abi: StoryLineABI,
          functionName: 'getDataBatchForTokenIds',
          args: [tokenIds, dataKeys],
          account: profileAddress
        }) as string[];

        const provider = new ethers.JsonRpcProvider(network.rpcUrl, chainId, {
          staticNetwork: ethers.Network.from(chainId),
        });

        const myErc725 = new ERC725(lsp4MetadataSchema, storyLinesContract, provider);

        // Convert from contract format to component format
        const formattedStoryHistory = [];
        for (const item of storyLines) {
          const decoded = myErc725.decodeData({
            // @ts-expect-error unknown type
            keyName: 'LSP4Metadata',
            value: item,
          });
          const metadataIpfsUrl = network.ipfsGateway + decoded.value.url.replace("ipfs://", "");
          const lsp4Metadata = await fetchLSP4Metadata(metadataIpfsUrl);
          const attributes = lsp4Metadata.LSP4Metadata.attributes as { key: string, value: string }[];
          const author = attributes.filter(attribute =>  attribute.key === "author")[0].value;
          const timestamp = attributes.filter(attribute =>  attribute.key === "createdAt")[0].value;
          const ipfsImage = lsp4Metadata?.LSP4Metadata?.images?.[0]?.[0]?.url ?? '';
          const imageURL = ipfsImage ? network.ipfsGateway + ipfsImage.replace("ipfs://", "") : '';
          formattedStoryHistory.push(({
            prompt: lsp4Metadata.LSP4Metadata.description,
            imageURL: imageURL,
            author: author,
            timestamp: Number(timestamp),
            selected: false,

          }));
        }

        setStoryHistory(formattedStoryHistory);
        setStoryStarted(true);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading story history:', error);
      setLoading(false);
    }
  };

  const generateNextOptions = async () => {
    try {
      setLoading(true);
      // revoke previous blob URLs
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
      setCurrentImageData([]);

      const promptHistory = storyHistory.map(i => i.prompt);
      const options = await generateStoryOptions(promptHistory);
      setCurrentOptions(options);


    } catch (error) {
      console.error('Error generating options:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      const imageBlobs: Blob[] = [];
      const imagePromises = currentOptions.map((option, i) => {
        return generatePromptImage([option])
          .then(blob => {
            if (blob && blob.size > 0) {
              const pngBlob = new Blob([blob], { type: 'image/png' });
              const url = URL.createObjectURL(pngBlob);
              console.log('Created blob URL:', url);
              imageBlobs.push(blob);
              return url;
            } else {
              console.error(`Invalid blob for option ${i + 1}`);
              return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Ctext%3EImage unavailable%3C/text%3E%3C/svg%3E";
            }
          })
          .catch(error => {
            console.error(`Error generating image for option ${i + 1}:`, error);
            return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Ctext%3EImage unavailable%3C/text%3E%3C/svg%3E";
          });

      });

      setImageBlobs(imageBlobs);
      const imageUrls = await Promise.all(imagePromises);
      blobUrlsRef.current = imageUrls.filter(url => url.startsWith('blob:'));
      setCurrentImageData(imageUrls);
    }
    if(currentOptions.length) {
      fetchImages();
    }

  }, [currentOptions])

  const startNewStory = async () => {
    if (!initialPromptInput.trim() || !client || !profileAddress || !publicClient) return;

    if(chainId !== profileChainId) {
      console.log("Mismatch in chainId in start new story", chainId, profileChainId);
      setShowSwitchNetworkTooltip(true);
      //prompt to switch to the correct network
      return;
    }

    try {
      setTransactionPending(true);
      setCreateError(undefined);

      const initialPromptImage= await generatePromptImage([initialPromptInput]);
      const pngBlob = new Blob([initialPromptImage], { type: 'image/png' });
      const imageUrl = URL.createObjectURL(pngBlob);
      setNewStoryImage(imageUrl)
      const timestamp = Math.floor(Date.now() / 1000);
      const ipfsHash = await pinFileToIPFS(`${timestamp}.png`, initialPromptImage);

      const storylineAddress = await mintStoryline(
        client,
        publicClient,
        connectedAddress!,
        network.contractAddress,
        network.ipfsGateway,
        {
          title: `Story ${timestamp}`,
          description: initialPromptInput,
          urls: [],
          iconWidth: 1024,
          iconHeight: 1024,
          iconIpfsHash: ipfsHash,
          imageIpfsHash: ipfsHash,
          imageHeight: 1024,
          imageWidth: 1024,
          author: profileAddress!,
          createdAt: timestamp
        }
      )
      await registerLSP8Collection(
        client,
        publicClient,
        connectedAddress!,
        storylineAddress as `0x${string}`,
        network.ipfsGateway,
      );
      const newStoryPrompt = {
        prompt: initialPromptInput.trim(),
        author: profileAddress,
        imageURL: imageUrl,
        timestamp: timestamp,
        selected: true,
      };

      setStoryHistory([newStoryPrompt]);
      setStoryStarted(true);
      setInitialPromptInput('');
      setTransactionPending(false);
      setCurrentOptions([]);
      setCurrentImageData([]);
      setOptionSelectionLoading(false);
      setLoading(false);
    } catch (error: any) {
      if (!error.message || !error.message?.includes('User rejected the request')) {
        console.error('Error starting new story:', error);
        setCreateError(`Error starting new story, please try again: ${error.message}`);
      }
      setTransactionPending(false);
    }
  };

  const selectStoryOption = async (optionIndex: number) => {
    const optionText = currentOptions[optionIndex];
    const optionImage = imageBlobs[optionIndex];
    if (!client || !profileAddress || !optionText || !optionImage) return;

    if(!walletConnected) {
      //prompt to connect
      setShowConnectWalletTooltip(true);
      return;
    }

    if(chainId !== profileChainId) {
      console.log("Mismatch in chainId", chainId, profileChainId);
      setShowSwitchNetworkTooltip(true);
      //prompt to switch to the correct network
      return;
    }

    try {
      setTransactionPending(true);
      setOptionSelectionLoading(true);

      const timestamp = Math.floor(Date.now() / 1000);
      const ipfsHash = await pinFileToIPFS(`${timestamp}.png`, optionImage);

      // Call contract to add a new story prompt
      const existingStories = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: AdventureTimeABI,
        functionName: 'tokenIdsOf',
        args: [profileAddress],
        account: profileAddress
      }) as string[];

      await mintStorylinePrompt(
        client,
        publicClient,
        connectedAddress!,
        existingStories[existingStories.length - 1].replace("0x000000000000000000000000", "0x") as `0x${string}`,
        network.ipfsGateway,
        {
          title: `Prompt ${timestamp}`,
          description: optionText,
          urls: [],
          iconWidth: 1024,
          iconHeight: 1024,
          iconIpfsHash: ipfsHash,
          imageIpfsHash: ipfsHash,
          imageHeight: 1024,
          imageWidth: 1024,
          author: connectedAddress!,
          createdAt: timestamp
        }
      )

      // Update local state with new story prompt
      const imageURL = network.ipfsGateway + ipfsHash.replace("ipfs://", "");
      const newStoryPrompt = {
        prompt: optionText,
        author: connectedAddress!,
        imageURL: imageURL,
        timestamp: Math.floor(Date.now() / 1000),
        selected: true
      };

      // Update local state
      setStoryHistory([...storyHistory, newStoryPrompt]);

      // Clear options
      setCurrentOptions([]);
      setCurrentImageData([]);

      setTransactionPending(false);
      setOptionSelectionLoading(false);
      await generateNextOptions();
    } catch (error: any) {
      if (!error.message || !error.message?.includes('User rejected the request')) {
        console.error('Error selecting story option:', error);
      }
      setTransactionPending(false);
      setOptionSelectionLoading(false);
    }
  };

  const resetStory = async () => {
    if (!client || !profileAddress) return;

    if(!walletConnected) {
      //prompt to connect
      setShowConnectWalletTooltip(true);
      return;
    }

    if(chainId !== profileChainId) {
      console.log("Mismatch in chainId", chainId, profileChainId);
      setShowSwitchNetworkTooltip(true);
      //prompt to switch to the correct network
      return;
    }

    try {
      setStoryStarted(false);
    } catch (error: any) {
      if (!error.message || !error.message?.includes('User rejected the request')) {
        console.error('Error selecting story option:', error);
      }
      setTransactionPending(false);
      setOptionSelectionLoading(false);
      setLoading(false);
    }
  };

  // Render story options with enhanced styling and images
  const renderStoryOptions = () => {
    if (optionSelectionLoading) {
      return <div className="col-span-3 flex flex-col items-center py-8 text-white/70">Recording choice, please wait for transaction...</div>;
    }

    return currentOptions.map((option, index) => (
      <div key={index} className="p-1 hover:shadow-lg">
        <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-full">
          {/* Flex container for text and image */}
          <div className="flex flex-row items-start space-x-3 mb-4">
            {/* Text content - ensure it takes most of the space */}
            <div className="flex-grow">
              <p className="text-white">{option}</p>
            </div>

            {/* Image container - fixed size */}
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
              {currentImageData[index] ? (
                <img
                  src={currentImageData[index]}
                  alt={`Option ${index+1}`}
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Ctext%3EImage unavailable%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="w-full h-full text-white bg-gray-800 flex items-center justify-center text-xs">Loading...</div>
              )}
            </div>
          </div>

          {/* Button below the text/image row */}
          <button
            onClick={() => selectStoryOption(index)}
            disabled={transactionPending}
            className="bg-purple-600 text-white py-2 rounded mt-auto"
          >
            Choose This Path
          </button>
        </div>
      </div>
    ));
  };

  if(!profileAddress) {
    //return an error message, as this can only be used in a Lukso mini app
    return (
      <div className="text-center space-y-6">
        <p className="text-white/70 mb-6">
          This feature can only be used in a Lukso mini app.
          Get started by adding this URL to your Univeral Profile grid.
        </p>
        <span className="text-lg font-bold text-white truncate flex-1">https://storyadventuretime.yearone.io</span>
        <div className="flex items-center justify-center space-x-2 p-3 rounded-md max-w-md mx-auto">
          <button
            onClick={handleCopy}
            className="
                bg-gradient-to-r from-purple-600 to-blue-600
                text-white font-bold py-3 px-6
                rounded-full
                hover:from-purple-700 hover:to-blue-700
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Copy to clipboard"
          >
            Copy
          </button>
          <a target={"_blank"} className="
                bg-gradient-to-r from-purple-600 to-blue-600
                text-white font-bold py-3 px-6
                rounded-full
                hover:from-purple-700 hover:to-blue-700
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
             href="https://universaleverything.io/">Open your profile </a>
        </div>
        <div className="flex items-center justify-center">
          <iframe width="560" height="315" src="https://www.youtube.com/embed/8a3VHrpyZSc?si=jSKFMUDLytXaE2jI"
                  title="YouTube video player" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen></iframe>
        </div>

      </div>
    );
  }

  if (!storyStarted && profileAddress.toLowerCase() !== connectedAddress?.toLowerCase()) {
    return (
      <div className="text-center space-y-6">
        <p className="text-white/70 mb-6">
          Only the profile owner start the story. If you&apos;re the owner of this profile, please connect your wallet.
          If you&apos;re a visitor, please come back later once the story has been set by the owner.
        </p>
      </div>
    );
  }

  return !storyStarted ? (
          <div className="text-center space-y-6">
            {showSwitchNetworkTooltip && <SwitchNetworkExplainer connectedNetwork={chainId} profileNetwork={profileChainId} onClose={() => setShowSwitchNetworkTooltip(false)} />}
            <p className="text-white/70 mb-6">
              Begin your story with an imaginative opening scene
            </p>
            <div className="flex space-x-3 mb-3">
            <textarea
              value={initialPromptInput}
              onChange={(e) => setInitialPromptInput(e.target.value)}
              placeholder={mysteriousOpenings[Math.floor(Math.random() * mysteriousOpenings.length)]}
              rows={4}
              maxLength={150}
              className="
                w-full bg-gray-700/50 text-white
                rounded-xl p-4
                border-2 border-transparent
                focus:border-purple-500
                focus:outline-none
                transition-all duration-300
              "
            />
              <img src={newStoryImage} width={150}/>
            </div>
            <p>{createError}</p>
            <button
              onClick={startNewStory}
              disabled={!initialPromptInput.trim() || transactionPending}
              className="
                bg-gradient-to-r from-purple-600 to-blue-600
                text-white font-bold py-3 px-6
                rounded-full
                hover:from-purple-700 hover:to-blue-700
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {transactionPending ? 'Saving Your Tale, please wait for transaction...' : 'Begin Adventure'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs p-2 text-white">
              Scroll down to read the story and participate in the adventure! <a target="_blank" className="font-bold underline" href="https://storyadventuretime.yearone.io">Click here</a> to install on your profile.
            </p>
            {profileAddress === connectedAddress && (
              <p className="text-xs p-2 text-white"><button onClick={() => resetStory()} className="font-bold underline">Click here</button> to start a new story.</p>
            )}
            <div className="space-y-8">
              {showConnectWalletTooltip && <ConnectWalletExplainer onClose={() => setShowConnectWalletTooltip(false)} />}
              {showSwitchNetworkTooltip && <SwitchNetworkExplainer connectedNetwork={chainId} profileNetwork={profileChainId} onClose={() => setShowSwitchNetworkTooltip(false)} />}
              <div className="story-history-section">
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                  {storyHistory.map((item, index) => (
                    <StoryLine item={item} key={index} index={index} total={storyHistory.length} chainId={chainId} />
                  ))}
                </div>
              </div>

              <div className="story-options-section mt-8">
                <div className="flex justify-center space-x-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                    What Happens Next?
                  </h2>
                  <button
                    onClick={generateNextOptions}
                    className="
                    w-8 h-8
                    bg-purple-600 text-white font-bold
                    rounded-full
                    flex items-center justify-center
                    hover:bg-purple-700
                    transition-all duration-300
                    shadow-lg
                    "
                    disabled={loading}
                    aria-label="Refresh"
                  >
                    <IoReload />
                  </button>
                </div>

                {loading && !optionSelectionLoading ? (
                  <div className="flex justify-center items-center">
                    <p className="text-white/70 animate-pulse">
                      The story unfolds...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderStoryOptions()}
                  </div>
                )}
              </div>
            </div>
          </div>
  );
};

export default StoryAdventure;