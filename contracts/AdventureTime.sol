// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import the library and other modules
import {AdventureTimeHelpers} from "./AdventureTimeHelpers.sol";
import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {LSP8IdentifiableDigitalAssetCore} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAssetCore.sol";
import {LSP8Burnable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/extensions/LSP8Burnable.sol";
import {_LSP4_TOKEN_TYPE_COLLECTION, _LSP4_METADATA_KEY, _LSP4_CREATORS_ARRAY_KEY, _LSP4_CREATORS_MAP_KEY_PREFIX} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {LSP8Enumerable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/extensions/LSP8Enumerable.sol";
import {_LSP8_TOKENID_FORMAT_ADDRESS} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";

contract AdventureTime is LSP8Enumerable, LSP8Burnable {
    event StorylineCreated(string storyName, address storylineAddress, address vibeMaster);

    constructor(
        string memory nftProtocolName,
        string memory nftProtocolSymbol,
        address contractOwner
    )
        LSP8IdentifiableDigitalAsset(
            nftProtocolName,
            nftProtocolSymbol,
            contractOwner,
            _LSP4_TOKEN_TYPE_COLLECTION,
            _LSP8_TOKENID_FORMAT_ADDRESS
        )
    {
        _setData(
            _LSP4_CREATORS_ARRAY_KEY,
            hex"00000000000000000000000000000001"
        );
        bytes32 creatorIndex = bytes32(bytes16(_LSP4_CREATORS_ARRAY_KEY));
        _setData(creatorIndex, abi.encodePacked(contractOwner));
        _setData(
            bytes32(
                abi.encodePacked(
                    _LSP4_CREATORS_MAP_KEY_PREFIX,
                    hex"0000",
                    contractOwner
                )
            ),
            hex"24871b3d00000000000000000000000000000000"
        );
    }

    function mint(
        string memory storylineName,
        string memory storylineSymbol,
        address vibeMaster,
        bytes memory lsp4MetadataURIOfStoryline,
        bytes memory lsp4MetadataURIOfStartingPrompt
    ) public {
        address storylineAddress = AdventureTimeHelpers.deployStoryline(
            storylineName,
            storylineSymbol,
            vibeMaster,
            lsp4MetadataURIOfStoryline
        );

        // Emit the event with the address of the newly deployed contract
        emit StorylineCreated(storylineName, storylineAddress, vibeMaster);

        _mint(vibeMaster, bytes32(uint256(uint160(StorylineAddress))), true, "");
        // TODO: we NEED to also mint the first prompt in the storyline using the new address
        // use lsp4MetadataURIOfStartingPrompt when minting (Storyline(address).mint)
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        bytes32 tokenId,
        bytes memory data
    ) internal virtual override(LSP8Enumerable, LSP8IdentifiableDigitalAssetCore) {
        LSP8Enumerable._beforeTokenTransfer(from, to, tokenId, data);
    }
}
