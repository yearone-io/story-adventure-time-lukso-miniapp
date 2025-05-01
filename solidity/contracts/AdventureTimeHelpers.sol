// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Storyline} from "./Storyline.sol";

library AdventureTimeHelpers {
    function deployStoryline(
        string memory storylineName,
        string memory storylineSymbol,
        address curator,
        bytes memory lsp4MetadataURIOfStoryline
    ) external returns (address) {
        Storyline storylineAddress = new Storyline(
            storylineName,
            storylineSymbol,
            curator,
            lsp4MetadataURIOfStoryline
        );
        return address(storylineAddress);
    }
}
