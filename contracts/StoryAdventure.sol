// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title StoryAdventure
 * @dev A contract for storing and retrieving interactive story adventure data
 */
contract StoryAdventure {
    struct StoryPrompt {
        string prompt;
        address author;
        uint256 timestamp;
        bool selected;
    }

    struct Story {
        StoryPrompt[] storyLines;
        address owner;
        bool exists;
    }

    // Mapping from user address to their stories
    mapping(address => Story) private userStories;

    // Events
    event StoryStarted(address indexed owner, string initialPrompt);
    event PromptAdded(address indexed owner, string prompt);

    /**
     * @dev Modifier to check if caller owns the story
     */
    modifier onlyStoryOwner() {
        require(userStories[msg.sender].exists, "You don't have a story");
        require(userStories[msg.sender].owner == msg.sender, "Not the story owner");
        _;
    }

    /**
     * @dev Start a new story with initial prompt
     * @param initialPrompt The opening scene of the story
     */
    function startNewStory(string calldata initialPrompt) external {
        require(bytes(initialPrompt).length > 0, "Empty prompt");

        // If user already has a story, reset it
        if (userStories[msg.sender].exists) {
            delete userStories[msg.sender];
        }

        // Create new story prompt
        StoryPrompt memory newPrompt = StoryPrompt({
            prompt: initialPrompt,
            author: msg.sender,
            timestamp: block.timestamp,
            selected: true
        });

        // Initialize story array with first prompt
        StoryPrompt[] memory storyLines = new StoryPrompt[](1);
        storyLines[0] = newPrompt;

        // Set user story
        userStories[msg.sender] = Story({
            storyLines: storyLines,
            owner: msg.sender,
            exists: true
        });

        emit StoryStarted(msg.sender, initialPrompt);
    }

    /**
     * @dev Add a new prompt to the story
     * @param promptText The next part of the story
     * @param userAddress The address of the user whose story to add to
     */
    function addStoryPrompt(string calldata promptText, address userAddress) external {
        require(bytes(promptText).length > 0, "Empty prompt");
        require(bytes(promptText).length <= 150, "Prompt too long, max 150 characters");
        require(userStories[userAddress].exists, "User doesn't have a story");

        StoryPrompt memory newPrompt = StoryPrompt({
            prompt: promptText,
            author: msg.sender,
            timestamp: block.timestamp,
            selected: true
        });

        userStories[userAddress].storyLines.push(newPrompt);

        emit PromptAdded(userAddress, promptText);
    }

    /**
     * @dev Get the complete story history for a user
     * @return Array of story prompts
     */
    function getStoryHistory() external view returns (StoryPrompt[] memory) {
        require(userStories[msg.sender].exists, "No story found");
        return userStories[msg.sender].storyLines;
    }

    /**
     * @dev Check if user has a story
     * @return True if user has a story
     */
    function hasStory() external view returns (bool) {
        return userStories[msg.sender].exists;
    }

    /**
     * @dev Delete user's story
     */
    function deleteStory() external onlyStoryOwner {
        delete userStories[msg.sender];
    }
}
