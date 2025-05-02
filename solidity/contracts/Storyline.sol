// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP4_TOKEN_TYPE_COLLECTION, _LSP4_METADATA_KEY, _LSP4_CREATORS_ARRAY_KEY, _LSP4_CREATORS_MAP_KEY_PREFIX, _LSP4_TOKEN_SYMBOL_KEY, _LSP4_TOKEN_NAME_KEY} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";
import {_INTERFACEID_LSP0} from "@lukso/lsp0-contracts/contracts/LSP0Constants.sol";
import {LSP8Enumerable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/extensions/LSP8Enumerable.sol";
import {LSP8Burnable} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/extensions/LSP8Burnable.sol";
import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP8_TOKENID_FORMAT_NUMBER} from "@lukso/lsp8-contracts/contracts/LSP8Constants.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC165Checker } from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

// Interface to interact with LSP26 Follower System
interface ILSP26FollowerSystem {
    function isFollowing(address follower, address addr) external view returns (bool);
}

contract Storyline is LSP8Enumerable, LSP8Burnable {
    error StoryHasBeenFinalized();
    error ContributorNotAllowedByVibeMaster();
    bool public isMintingEnabled = true;
    uint256 private _nextTokenId;
    address public lsp26FollowerSystem;
    ILSP26FollowerSystem private lsp26;
    bool public isFollowerRestrictionEnabled;

    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        bool _isFollowerRestrictionEnabled,
        bytes memory _lsp4MetadataURI,
        bytes memory _lsp4MetadataURIOfStartingPrompt,
        address followerSystemContract
    )
        LSP8IdentifiableDigitalAsset(
            _name,
            _symbol,
            _creator,
            _LSP4_TOKEN_TYPE_COLLECTION, // collection type
            _LSP8_TOKENID_FORMAT_NUMBER
        )
        Ownable() 
    {
        bytes memory creatorStandard = hex"0000000000000000000000000000000000000000";
        if (
            ERC165Checker.supportsERC165InterfaceUnchecked(
                _creator,
                _INTERFACEID_LSP0
            )
        ) {
            creatorStandard = hex"24871b3d00000000000000000000000000000000";
        }
        lsp26FollowerSystem = followerSystemContract;
        lsp26 = ILSP26FollowerSystem(followerSystemContract);
        isFollowerRestrictionEnabled = _isFollowerRestrictionEnabled;
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
            creatorStandard
        );

        // Mint the first prompt
        _nextTokenId = 1;
        bytes32 tokenId = bytes32(_nextTokenId);
        _mint(_creator, tokenId, true, "");
        _setDataForTokenId(tokenId, _LSP4_METADATA_KEY, _lsp4MetadataURIOfStartingPrompt);
        _setDataForTokenId(tokenId, 
            _LSP4_CREATORS_ARRAY_KEY,
            hex"00000000000000000000000000000001"
        );
        bytes32 promptCreatorIndex = bytes32(bytes16(_LSP4_CREATORS_ARRAY_KEY));
        _setDataForTokenId(tokenId, promptCreatorIndex, abi.encodePacked(_creator));
        _setDataForTokenId(tokenId,
            bytes32(
                abi.encodePacked(
                    _LSP4_CREATORS_MAP_KEY_PREFIX,
                    hex"0000",
                    _creator
                )
            ),
            creatorStandard
        );
        _nextTokenId += 1;
    }

    // mint a storyline prompt
    function mint(bytes memory _lsp4MetadataURI) public {
        bytes memory creatorStandard = hex"0000000000000000000000000000000000000000";
        if (
            ERC165Checker.supportsERC165InterfaceUnchecked(
                msg.sender,
                _INTERFACEID_LSP0
            )
        ) {
            creatorStandard = hex"24871b3d00000000000000000000000000000000";
        }
        if (!isMintingEnabled) {
            revert StoryHasBeenFinalized();
        }
        if (isFollowerRestrictionEnabled && !lsp26.isFollowing(owner(), msg.sender)) {
            // Check if the owner follows the contributor
            revert ContributorNotAllowedByVibeMaster();
        }
        bytes32 tokenId = bytes32(_nextTokenId);
        _mint(msg.sender, tokenId, true, "");
        _setDataForTokenId(tokenId, _LSP4_METADATA_KEY, _lsp4MetadataURI);
        // setting the creator
        _setDataForTokenId(tokenId, 
            _LSP4_CREATORS_ARRAY_KEY,
            hex"00000000000000000000000000000001"
        );
        bytes32 creatorIndex = bytes32(bytes16(_LSP4_CREATORS_ARRAY_KEY));
        _setDataForTokenId(tokenId, creatorIndex, abi.encodePacked(msg.sender));
        _setDataForTokenId(tokenId,
            bytes32(
                abi.encodePacked(
                    _LSP4_CREATORS_MAP_KEY_PREFIX,
                    hex"0000",
                    msg.sender
                )
            ),
            creatorStandard
        );
        _nextTokenId += 1;
    }

    function disableMinting() public onlyOwner {
        isMintingEnabled = false;
    }

    function burnToken(bytes32 tokenId) public onlyOwner {
        _burn(tokenId, "");
    }

    function toggleFollowerRestriction(bool _enabled) public onlyOwner {
        isFollowerRestrictionEnabled = _enabled;
    }

    function setLSP26Address(address followerSystemContract) public onlyOwner {
        lsp26FollowerSystem = followerSystemContract;
        lsp26 = ILSP26FollowerSystem(followerSystemContract);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        bytes32 tokenId,
        bool force,
        bytes memory data
    ) internal virtual override(LSP8Enumerable, LSP8IdentifiableDigitalAsset) {
        LSP8Enumerable._beforeTokenTransfer(from, to, tokenId, force, data);
    }
}
