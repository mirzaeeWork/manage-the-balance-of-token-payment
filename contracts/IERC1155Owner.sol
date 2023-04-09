// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC1155Owner{
    function OwnerOf(uint256 _id)
        external
        view
        returns (address owner, uint256 countToken);
}