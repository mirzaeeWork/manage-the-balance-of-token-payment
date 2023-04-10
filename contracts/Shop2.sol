// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "contracts/IERC1155Owner.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract Shop is Context {
    using Counters for Counters.Counter;

    struct ItemERC115 {
        address nftContract;
        uint256 tokenId;
        address payable owner;
        uint256 amountOfToken;
        uint256 price;
        bool sold;
    }

    struct order {
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 price;
    }

    mapping(uint256 => ItemERC115) public itemERC1155;
    Counters.Counter private itemIds;

    mapping(address => uint256) public balances;

    mapping(address => order[]) public OrdersAccount;

    event _createItemERC115(
        address nftContract,
        uint256 tokenId,
        address owner,
        uint256 amountOfToken,
        uint256 price, //Based on Ethereum
        bool sold
    );

    event _buyItem(
        address nftContract,
        address seller,
        address buyer,
        uint256 tokenId,
        uint256 amountOfToken
    );

    function createItemERC115(
        address _nftContract,
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
        (owner, ) = IERC1155Owner(_nftContract).OwnerOf(_tokenId);
        require(owner == _msgSender(), "createMarketItem : only owner");
        itemERC1155[_itemId] = ItemERC115(
            _nftContract,
            _tokenId,
            payable(_msgSender()),
            _amountOfToken,
            _price,
            false
        );
        emit _createItemERC115(
            _nftContract,
            _tokenId,
            _msgSender(),
            _amountOfToken,
            _price,
            false
        );
        itemIds.increment();
    }

    function buyItem(IERC1155 _nftContract, uint256 itemId_) public payable {
        uint256 _itemId = itemIds.current();
        require(itemId_ < _itemId, "createAuction: it is not item ");

        require(msg.value > 0, "buyToken : Insufficient inventory");
        ItemERC115 storage item = itemERC1155[itemId_];

        require(
            msg.value == item.price,
            "buyToken : Please Paye Correct Price"
        );

        (bool sent, ) = item.owner.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        _nftContract.safeTransferFrom(
            item.owner,
            _msgSender(),
            item.tokenId,
            item.amountOfToken,
            "0x0"
        );
        item.owner = payable(_msgSender());
        item.sold = true;
        balances[_msgSender()] += msg.value;
        OrdersAccount[_msgSender()].push(
            order({
                nftContract: address(_nftContract),
                tokenId: item.tokenId,
                amount: item.amountOfToken,
                price: item.price
            })
        );
        emit _buyItem(
            address(_nftContract),
            item.owner,
            _msgSender(),
            item.tokenId,
            item.amountOfToken
        );
    }

    receive() external payable {}
}
