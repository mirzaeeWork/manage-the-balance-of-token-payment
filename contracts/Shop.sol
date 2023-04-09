// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "contracts/IERC1155Owner.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Shop is Context {
    using Counters for Counters.Counter;

    IERC20 public tokenERC20;
    IERC1155 public nftContract;
    IERC1155Owner public erc1155Owner;

    constructor(IERC20 _tokenERC20, address _nftContract) {
        tokenERC20 = _tokenERC20;
        nftContract = IERC1155(_nftContract);
        erc1155Owner=IERC1155Owner(_nftContract); 
    }

    struct ItemERC115 {
        uint256 tokenId;
        address payable owner;
        uint256 amountOfToken;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => ItemERC115) public itemERC1155;
    Counters.Counter private itemIds;

    // mapping(address => uint256) public balances;

    event _createItemERC115(
        uint256 tokenId,
        address owner,
        uint256 amountOfToken,
        uint256 price,
        bool sold
    );

    event _buyItem(
        uint256 tokenId,
        address owner,
        address buyer,
        uint256 amountOfToken
    );

    function createItemERC115(
        uint256 _tokenId,
        uint256 _amountOfToken,
        uint256 _price
    ) public {
        require(
            _amountOfToken > 0,
            "createItemERC115 : The amount of tokens to sell, needs to be greater than 0"
        );
        require(
            _price > 0,
            "createItemERC115 : The full price for the tokens need to be greater than 0"
        );
        uint256 _itemId = itemIds.current();

        address owner;
        (owner, ) = IERC1155Owner(erc1155Owner).OwnerOf(_tokenId);
        require(owner == _msgSender(), "createMarketItem : only owner");
        itemERC1155[_itemId] = ItemERC115(
            _tokenId,
            payable(_msgSender()),
            _amountOfToken,
            _price,
            false
        );
        emit _createItemERC115(
            _tokenId,
            _msgSender(),
            _amountOfToken,
            _price,
            false
        );
        itemIds.increment();
    }

    function buyItem(uint256 itemId_, uint256 amount) public {
        uint256 _itemId = itemIds.current();
        require(itemId_ < _itemId, "createAuction: it is not item ");

        require(
            amount > 0 && tokenERC20.balanceOf(_msgSender()) >= amount,
            "buyToken : Insufficient inventory"
        );
        ItemERC115 storage item = itemERC1155[itemId_];

        require(amount == item.price, "buyToken : Please Paye Correct Price");
        tokenERC20.transferFrom(_msgSender(),item.owner, amount);
        nftContract.safeTransferFrom(
                item.owner,
                _msgSender(),
                item.tokenId ,
                item.amountOfToken,
                "0x0"
            );
        item.owner=payable(_msgSender());
        item.sold=true; 
        emit _buyItem(
            item.tokenId,
            item.owner,
            _msgSender(),
            item.amountOfToken
        );
    }
}
