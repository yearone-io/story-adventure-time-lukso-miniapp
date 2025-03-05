"use client";

import React, { useState, useEffect } from 'react';
import { useUpProvider } from "@/components/upProvider";
import { getContract, PublicClient, WalletClient } from "viem";

// This would be your LLM API service
import { generateStoryOptions } from '../services/llm-service';

// Import ABI of your deployed contract
import StoryAdventureABIFile from '../contracts/StoryAdventure.json';
import { supportedNetworks } from "@/config/networks";
import ConnectWalletExplainer from "@/components/ConnectWalletExplainer";
const StoryAdventureABI = StoryAdventureABIFile.abi;

type StoryPrompt = { prompt: string, timestamp: number, selected: boolean };

const StoryAdventure = () => {
  const { client, publicClient, contextAccounts, chain, walletConnected } =
    useUpProvider();

  const account = contextAccounts[0];

  const [loading, setLoading] = useState(false);
  const [storyHistory, setStoryHistory] = useState<StoryPrompt[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [initialPromptInput, setInitialPromptInput] = useState('');
  const [storyStarted, setStoryStarted] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [optionSelectionLoading, setOptionSelectionLoading] = useState(false);
  const [showConnectWalletTooltip, setShowConnectWalletTooltip] = useState(false);
  const network = supportedNetworks[chain?.id];
  const CONTRACT_ADDRESS = network.contractAddress;


  // Create contract instance when client is available
  const getStoryContract = (client: WalletClient | PublicClient) => {
    if (!client || !CONTRACT_ADDRESS) return null;

    return getContract({
      address: CONTRACT_ADDRESS,
      abi: StoryAdventureABI,
      client: client,
    });
  };

  useEffect(() => {
    loadStoryHistory();
  }, [account, publicClient]);

  // Generate new options whenever story history changes
  useEffect(() => {
    if (storyHistory.length > 0 && storyStarted) {
      generateNextOptions();
    }
  }, [storyHistory, storyStarted]);

  const loadStoryHistory = async () => {
    try {
      setLoading(true);

      const contract = getStoryContract(publicClient);
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
        account
      });

      if (hasStory) {
        // Get story history from the contract
        const storyData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: StoryAdventureABI,
          functionName: 'getStoryHistory',
          account
        }) as StoryPrompt[];

        // Convert from contract format to component format
        const formattedStoryHistory = storyData.map(item => ({
          prompt: item.prompt,
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
    if (!initialPromptInput.trim() || !client || !account || !publicClient) return;

    try {
      setTransactionPending(true);

      // Call contract to start a new story
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: StoryAdventureABI,
        functionName: "startNewStory",
        args: [initialPromptInput.trim()],
        account,
        chain: chain
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Update local state with new story prompt
      const newStoryPrompt = {
        prompt: initialPromptInput.trim(),
        timestamp: Math.floor(Date.now() / 1000),
        selected: true
      };

      setStoryHistory([newStoryPrompt]);
      setStoryStarted(true);
      setInitialPromptInput('');
      setTransactionPending(false);
    } catch (error) {
      console.error('Error starting new story:', error);
      setTransactionPending(false);
    }
  };

  const selectStoryOption = async (optionText: string) => {
    if (!client || !account) return;

    if(!walletConnected) {
      //prompt to connect
      setShowConnectWalletTooltip(true);
      return;
    }

    try {
      setTransactionPending(true);
      setOptionSelectionLoading(true);

      // Call contract to add a new story prompt
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: StoryAdventureABI,
        functionName: "addStoryPrompt",
        args: [optionText],
        account,
        chain: chain
      });

      await publicClient.waitForTransactionReceipt({ hash });

      // Update local state with new story prompt
      const newStoryPrompt = {
        prompt: optionText,
        timestamp: Math.floor(Date.now() / 1000),
        selected: true
      };

      // Update local state
      setStoryHistory([...storyHistory, newStoryPrompt]);
      setCurrentOptions([]);
      setTransactionPending(false);
      setOptionSelectionLoading(false);
    } catch (error) {
      console.error('Error selecting story option:', error);
      setTransactionPending(false);
      setOptionSelectionLoading(false);
    }
  };

  // Render story history
  const renderStoryHistory = () => {
    return storyHistory.map((item, index) => (
      <div
        key={index}
        className={`
          relative p-4 bg-white/10 rounded-lg shadow-md 
          transform transition-all duration-300 hover:scale-[1.02]
          ${index === storyHistory.length - 1 ? 'border-2 border-purple-500' : ''}
        `}
      >
        <p className="text-white/90 italic text-base">{item.prompt}</p>
        {index < storyHistory.length - 1 && (
          <div className="absolute top-1/2 right-[-30px] transform -translate-y-1/2 rotate-90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </div>
    ));
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

  if(!account) {
    //return an error message, as this can only be used in a Lukso mini app
    return (
      <div className="text-center space-y-6">
        <p className="text-white/70 mb-6">
          This feature can only be used in a Lukso mini app.
          Get started by adding this URL to your Univeral Profile grid.
        </p>
      </div>
    );
  };

  return !storyStarted ? (
          <div className="text-center space-y-6">
            <p className="text-white/70 mb-6">
              Begin your story with an imaginative opening scene
            </p>
            <textarea
              value={initialPromptInput}
              onChange={(e) => setInitialPromptInput(e.target.value)}
              placeholder="It was a dark and stormy night when..."
              rows={4}
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
          <div className="space-y-8">
            {showConnectWalletTooltip && <ConnectWalletExplainer onClose={() => setShowConnectWalletTooltip(false)} />}
            <div className="story-history-section">
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                {renderStoryHistory()}
              </div>
            </div>

            <div className="story-options-section mt-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                What Happens Next?
              </h2>
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
  );
};

export default StoryAdventure;