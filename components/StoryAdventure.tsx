"use client";

import React, { useState, useEffect } from 'react';
import { useUpProvider } from "@/components/upProvider";
import { getContract } from "viem";

// This would be your LLM API service
import { generateStoryOptions } from "@/services/llm-service";

// Import ABI of your deployed contract
import StoryAdventureABIFile from '../contracts/StoryAdventure.json';
import ConnectWalletExplainer from "@/components/ConnectWalletExplainer";
import { supportedNetworks } from "@/config/networks";
import SwitchNetworkExplainer from "@/components/SwitchNetworkExplainer";
import StoryLine from "@/components/StoryLine";
import { StoryPrompt } from "@/types/story";
import { IoReload } from "react-icons/io5";
const StoryAdventureABI = StoryAdventureABIFile.abi;

const StoryAdventure = () => {
  const { client, publicClient, accounts, contextAccounts, walletConnected, chainId, profileChainId } =
    useUpProvider();

  const profileAddress = contextAccounts[0];
  const connectedAddress = accounts.length ? accounts[0] : null;

  const [loading, setLoading] = useState(false);
  const [storyHistory, setStoryHistory] = useState<StoryPrompt[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [initialPromptInput, setInitialPromptInput] = useState('');
  const [storyStarted, setStoryStarted] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [optionSelectionLoading, setOptionSelectionLoading] = useState(false);
  const [showConnectWalletTooltip, setShowConnectWalletTooltip] = useState(false);
  const [showSwitchNetworkTooltip, setShowSwitchNetworkTooltip] = useState(false);
  const network = supportedNetworks[profileChainId];
  const CONTRACT_ADDRESS = network.contractAddress;

  const mysteriousOpenings = [
    "The note on the door simply read: 'Don’t turn around.'",
    "A single candle flickered in the abandoned house, though no one had lived there for years.",
    "She woke up in an unfamiliar room, with no memory of how she got there.",
    "The clock struck midnight, and the phone began to ring—a call from someone who had died a year ago.",
    "Footsteps echoed behind me in the empty alley, but when I turned, no one was there.",
    "The old photograph had changed—someone new was standing in the background.",
    "I found a diary under my floorboards, and it was written in my handwriting… but I had never seen it before.",
    "Every night, at exactly 3:13 AM, the door to my closet creaks open.",
    "The letter was signed with my name, but I had never written it.",
    "A shadow moved across the window, but I was on the 12th floor.",
    "There was a new grave in the cemetery… with today’s date on the headstone.",
    "He had been gone for five years, yet he walked into the café as if nothing had happened.",
    "A stranger on the train whispered, ‘They’re coming for you tonight.’",
    "The whispers in the attic grew louder every night, though I lived alone.",
    "She had seen her own reflection blink at her.",
    "The town had vanished from the map overnight, as if it had never existed.",
    "I received a text from my sister, but she had disappeared a decade ago.",
    "The radio turned on by itself, playing a song that hadn’t been released yet.",
    "As I blew out my birthday candles, someone whispered, ‘Make your last wish count.’",
    "The painting in the hallway had changed—now the woman’s eyes were looking directly at me."
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("https://universal-story.netlify.app/");
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Create contract instance when client is available
  const getStoryContract = () => {
    if (!client || !CONTRACT_ADDRESS) return null;

    return getContract({
      address: CONTRACT_ADDRESS,
      abi: StoryAdventureABI,
      client: publicClient,
    });
  };

  useEffect(() => {
    loadStoryHistory();
  }, [profileAddress, publicClient]);

  // Generate new options whenever story history changes
  useEffect(() => {
    if (storyHistory.length > 0 && storyStarted) {
      generateNextOptions();
    }
  }, [storyHistory, storyStarted]);

  const loadStoryHistory = async () => {
    try {
      setLoading(true);

      const contract = getStoryContract();
      if (!contract) {
        console.error('Contract not available');
        setLoading(false);
        return;
      }

      // Check if user has a story
      const hasStory = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: StoryAdventureABI,
        functionName: 'hasStory',
        account: profileAddress
      });

      if (hasStory) {
        // Get story history from the contract
        const storyData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: StoryAdventureABI,
          functionName: 'getStoryHistory',
          account: profileAddress
        }) as StoryPrompt[];

        // Convert from contract format to component format
        const formattedStoryHistory = storyData.map(item => ({
          prompt: item.prompt,
          author: item.author,
          timestamp: Number(item.timestamp),
          selected: item.selected
        }));

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

      // Extract just the prompt texts for the LLM
      const promptHistory = storyHistory.map(item => item.prompt);

      // Call your LLM API to generate the next 3 options
      const options = await generateStoryOptions(promptHistory);
      setCurrentOptions(options);

      setLoading(false);
    } catch (error) {
      console.error('Error generating story options:', error);
      setLoading(false);
    }
  };

  const startNewStory = async () => {
    if (!initialPromptInput.trim() || !client || !profileAddress || !publicClient) return;

    if(chainId !== profileChainId) {
      console.log("Mismatch in chainId in start new story", chainId, profileChainId);
      setShowSwitchNetworkTooltip(true);
      //prompt to switch to the correct network
      return;
    }

    console.log("chainId", chainId, profileChainId);
    try {
      setTransactionPending(true);
      // Get image based on prompt
      // const generateImage = await generatePromptImage([initialPromptInput.trim()]);
      // console.log("generateImage", generateImage);
      // const imageIpfsHash = await pinFileToIPFS("test", generateImage);
      // console.log("imageIpfsHash", imageIpfsHash);

      // Call contract to start a new story
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: StoryAdventureABI,
        functionName: "startNewStory",
        args: [initialPromptInput.trim()],
        account: connectedAddress,
        chain: client.chain
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Update local state with new story prompt
      const newStoryPrompt = {
        prompt: initialPromptInput.trim(),
        author: profileAddress,
        timestamp: Math.floor(Date.now() / 1000),
        selected: true
      };

      setStoryHistory([newStoryPrompt]);
      setStoryStarted(true);
      setInitialPromptInput('');
      setTransactionPending(false);
    } catch (error: any) {
      if (!error.message || !error.message?.includes('User rejected the request')) {
        console.error('Error starting new story:', error);
      }
      setTransactionPending(false);
    }
  };

  const selectStoryOption = async (optionText: string) => {
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
      setTransactionPending(true);
      setOptionSelectionLoading(true);

      // Get image based on prompt
      // const generateImage = await generatePromptImage([initialPromptInput.trim()]);
      // console.log("generateImage", generateImage);
      // const imageIpfsHash = await pinFileToIPFS("test", generateImage);
      // console.log("imageIpfsHash", imageIpfsHash);

      // Call contract to add a new story prompt
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: StoryAdventureABI,
        functionName: "addStoryPrompt",
        args: [optionText, profileAddress],
        account: connectedAddress,
        chain: client.chain
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Update local state with new story prompt
      const newStoryPrompt = {
        prompt: optionText,
        author: connectedAddress!,
        timestamp: Math.floor(Date.now() / 1000),
        selected: true
      };

      // Update local state
      setStoryHistory([...storyHistory, newStoryPrompt]);
      setCurrentOptions([]);
      setTransactionPending(false);
      setOptionSelectionLoading(false);
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
      setLoading(true);
      setTransactionPending(true);
      setOptionSelectionLoading(true);

      // Call contract to add a new story prompt
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: StoryAdventureABI,
        functionName: "deleteStory",
        args: [],
        account: connectedAddress,
        chain: client.chain
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Update local state
      setStoryHistory([]);
      setCurrentOptions([]);
      setTransactionPending(false);
      setOptionSelectionLoading(false);
      setLoading(false);
      setStoryStarted(false);
      setInitialPromptInput("");
    } catch (error: any) {
      if (!error.message || !error.message?.includes('User rejected the request')) {
        console.error('Error selecting story option:', error);
      }
      setTransactionPending(false);
      setOptionSelectionLoading(false);
      setLoading(false);
    }
  };


  // Render story options with enhanced styling
  const renderStoryOptions = () => {
    if (optionSelectionLoading) {
      return (
        <div className="col-span-3 flex flex-col items-center justify-center space-y-4 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-white/80 text-lg animate-pulse">Recording your choice on the blockchain...</p>
        </div>
      );
    }

    return currentOptions.map((option, index) => (
      <div
        key={index}
        className="
          transform transition-all duration-300
          hover:scale-105 hover:shadow-lg
          bg-gradient-to-br from-purple-600/20 to-blue-600/20
          rounded-xl p-1
        "
      >
        <button
          onClick={() => selectStoryOption(option)}
          disabled={transactionPending}
          className="
            w-full h-full
            bg-gray-900/80 text-white
            rounded-lg p-3
            hover:bg-gradient-to-r
            hover:from-purple-700 hover:to-blue-700
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {option}
        </button>
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
        <div className="flex items-center justify-center space-x-2 p-3 rounded-md max-w-md mx-auto">
          <span className="text-lg font-bold text-white truncate flex-1">https://universal-story.netlify.app</span>
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
        </div>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/8a3VHrpyZSc?si=jSKFMUDLytXaE2jI"
                title="YouTube video player" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen></iframe>
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
              {transactionPending ? 'Saving Your Tale...' : 'Begin Adventure'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs p-2 text-white">
              Scroll down to read the story and participate in the adventure! <a target="_blank" className="font-bold underline" href="https://universal-story.netlify.app">Click here</a> to install on your profile.
            </p>
            {profileAddress === connectedAddress && (
              <p className="text-xs p-2 text-white"><button onClick={() => resetStory()} className="font-bold underline">Click here</button> to reset your story. This will delete all the history and let you start with a fresh story line.</p>
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