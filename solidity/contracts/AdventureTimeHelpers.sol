// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Storyline} from "./Storyline.sol";

library AdventureTimeHelpers {
    function deployStoryline(
        string memory storylineName,
        string memory storylineSymbol,
        address curator,
        bool isFollowerRestrictionEnabled,
        bytes memory lsp4MetadataURIOfStoryline,
        bytes memory lsp4MetadataURIOfStartingPrompt,
        address followerSystemContract
    ) external returns (address) {
        Storyline storylineAddress = new Storyline(
            storylineName,
            storylineSymbol,
            curator,
            isFollowerRestrictionEnabled,
            lsp4MetadataURIOfStoryline,
            lsp4MetadataURIOfStartingPrompt,
            followerSystemContract
        );
        return address(storylineAddress);
    }
}
