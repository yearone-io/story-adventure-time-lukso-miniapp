// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockLSP26FollowerSystem {
    mapping(address => mapping(address => bool)) private following;

    function isFollowing(address _follower, address _addr) external view returns (bool) {
        return following[_follower][_addr];
    }

    function setFollowing(address _follower, address _addr, bool _isFollowing) external {
        following[_follower][_addr] = _isFollowing;
    }
}