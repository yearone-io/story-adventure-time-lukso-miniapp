import React, { useState, useEffect } from 'react';
import { useUpProvider } from "@/components/upProvider";
import { getContract, PublicClient, WalletClient } from "viem";

// This would be your LLM API service
import { generateStoryOptions } from '../services/llm-service';

// Import ABI of your deployed contract
import StoryAdventureABIFile from '../contracts/StoryAdventure.json';
import { supportedNetworks } from "@/config/networks";
const StoryAdventureABI = StoryAdventureABIFile.abi;

type StoryPrompt = { prompt: string, timestamp: number, selected: boolean };

const StoryAdventure = () => {
  const { client, publicClient, contextAccounts, walletConnected, chain } =
    useUpProvider();

  const account = contextAccounts[0];

  const [loading, setLoading] = useState(false);
  const [storyHistory, setStoryHistory] = useState<StoryPrompt[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [initialPromptInput, setInitialPromptInput] = useState('');
  const [storyStarted, setStoryStarted] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
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

  // Load story history when account is connected
  useEffect(() => {
    if (account && client && walletConnected) {
      loadStoryHistory();
    }
  }, [account, client, walletConnected]);

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

    try {
      setTransactionPending(true);

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
    } catch (error) {
      console.error('Error selecting story option:', error);
      setTransactionPending(false);
    }
  };

  // Render story history
  const renderStoryHistory = () => {
    return storyHistory.map((item, index) => (
      <div key={index} className="story-segment">
        <p className="story-text">{item.prompt}</p>
        {index < storyHistory.length - 1 && <div className="story-connector">→</div>}
      </div>
    ));
  };

  // Render story options
  const renderStoryOptions = () => {
    return currentOptions.map((option, index) => (
      <div key={index} className="option-card">
        <lukso-button
          onClick={() => selectStoryOption(option)}
          disabled={transactionPending}
        >
          {option}
        </lukso-button>
      </div>
    ));
  };

  return (
    <div className="story-adventure-container">
      {!account || !walletConnected ? (
        <div className="connect-prompt">
          <p>Connect your Universal Profile to start or continue your adventure</p>
          {/* Assuming you have a connect wallet component */}
          {/*<ConnectWallet />*/}
        </div>
      ) : (
        <>
          {!storyStarted ? (
            <div className="new-story-section">
              <p>Create the opening scene for your story</p>
              <textarea
                value={initialPromptInput}
                onChange={(e) => setInitialPromptInput(e.target.value)}
                placeholder="It was a dark and stormy night when..."
                rows={4}
                className="prompt-input"
              />
              <lukso-button
                onClick={startNewStory}
                disabled={!initialPromptInput.trim() || transactionPending}
              >
                {transactionPending ? 'Saving...' : 'Begin Adventure'}
              </lukso-button>
            </div>
          ) : (
            <>
              <div className="story-history-section">
                <h2>Your Journey So Far</h2>
                <div className="story-timeline">
                  {renderStoryHistory()}
                </div>
              </div>

              <div className="story-options-section">
                <h2>What happens next?</h2>
                {loading ? (
                  <p>The story unfolds...</p>
                ) : (
                  <div className="options-grid">
                    {renderStoryOptions()}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StoryAdventure;
