// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {LSP8IdentifiableDigitalAssetCore} from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAssetCore.sol";
import {LSP4DigitalAssetMetadata} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4DigitalAssetMetadata.sol";
import {_LSP4_TOKEN_TYPE_COLLECTION, _LSP4_METADATA_KEY, _LSP4_CREATORS_ARRAY_KEY, _LSP4_CREATORS_MAP_KEY_PREFIX, _LSP4_TOKEN_SYMBOL_KEY, _LSP4_TOKEN_NAME_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {LSP8Enumerable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/extensions/LSP8Enumerable.sol";
import {LSP8Burnable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/extensions/LSP8Burnable.sol";
import {LSP8Mintable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/presets/LSP8Mintable.sol";
import {_LSP8_REFERENCE_CONTRACT} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol";
import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp8-contracts/contracts/LSP8Constants.sol";

contract Storyline is LSP8Enumerable, LSP8Mintable, LSP8Burnable {
    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        bytes memory _lsp4MetadataURI
    )
        LSP8Mintable(
            _name,
            _symbol,
            _creator,
            _LSP4_TOKEN_TYPE_COLLECTION, // collection type
            _LSP8_TOKENID_FORMAT_NUMBER
        )
    {
        _setData(_LSP4_METADATA_KEY, _lsp4MetadataURI);
        // setting the creator
        _setData(
            _LSP4_CREATORS_ARRAY_KEY,
            hex"00000000000000000000000000000001"
        );
        bytes32 creatorIndex = bytes32(bytes16(_LSP4_CREATORS_ARRAY_KEY));
        _setData(creatorIndex, abi.encodePacked(_creator));
        _setData(
            bytes32(
                abi.encodePacked(
                    _LSP4_CREATORS_MAP_KEY_PREFIX,
                    hex"0000",
                    _creator
                )
            ),
            hex"24871b3d00000000000000000000000000000000"
        );
    }

    function _setData(
        bytes32 dataKey,
        bytes memory dataValue
    ) internal override {
        require(
            dataKey != _LSP8_REFERENCE_CONTRACT,
            "LSP8ReferenceContractNotEditable"
        );
        if (dataKey == _LSP4_TOKEN_SYMBOL_KEY || dataKey == _LSP4_TOKEN_NAME_KEY) {
            _store[dataKey] = dataValue;
            emit DataChanged(dataKey, dataValue);
        } else {
            LSP4DigitalAssetMetadata._setData(dataKey, dataValue);
        }
    }

    // mint a storyline prompt
    function mint(bytes memory _lsp4MetadataURI, address promptCreator) public {
        // iterate id
        LSP8Mintable.mint(owner(), totalSupply() + 1, true, "");
        _setDataForTokenId(tokenId, _LSP4_METADATA_KEY, _lsp4MetadataURI);
        // setting the creator
        _setDataForTokenId(tokenId, 
            _LSP4_CREATORS_ARRAY_KEY,
            hex"00000000000000000000000000000001"
        );
        bytes32 creatorIndex = bytes32(bytes16(_LSP4_CREATORS_ARRAY_KEY));
        _setDataForTokenId(tokenId, creatorIndex, abi.encodePacked(promptCreator));
        _setDataForTokenId(tokenId,
            bytes32(
                abi.encodePacked(
                    _LSP4_CREATORS_MAP_KEY_PREFIX,
                    hex"0000",
                    promptCreator
                )
            ),
            hex"24871b3d00000000000000000000000000000000"
        );
    }

    // TODO: make prompts burnable by anyone
    // TODO: enable disabling minting aka finalizing story once and for all
    // TODO: (optional) contributors must be followed by story creator

    function _beforeTokenTransfer(
        address from,
        address to,
        bytes32 tokenId,
        bytes memory data
    ) internal virtual override(LSP8Enumerable, LSP8IdentifiableDigitalAssetCore) {
        LSP8Enumerable._beforeTokenTransfer(from, to, tokenId, data);
    }
}
