// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "contracts/IERC1155Owner.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";



contract Shop is Context{
    using Counters for Counters.Counter;

    struct product {
        address nftContract;
        uint256 tokenId;
        address payable owner;
        uint256 amountOfToken;
        uint256 price;
        bool sold;
        address tokenErc20;
    }

    mapping(uint256 => product) public itemProduct;
    Counters.Counter private itemIds;

    struct peyment{
        address buyer;
        uint256 price;
        bool state;
    }

    mapping(address => uint) public balances;
    mapping(uint256 => peyment) public payments;


    event _createItemProduct(
        address nftContract,
        uint256 tokenId,
        address owner,
        uint256 amountOfToken,
        uint256 price, //Based on Ethereum
        bool sold
    );

    function getBalanaceAddress(address _account)public view returns(uint256){
        return _account.balance; 
    }


    function createItemProduct(
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
        require(IERC165(_nftContract).supportsInterface(type(IERC1155).interfaceId),"createItemProduct : address is not contract");
        itemProduct[_itemId] = product(
            _nftContract,
            _tokenId,
            payable(_msgSender()),
            _amountOfToken,
            _price,
            false,
            address(0)
        );
        emit _createItemProduct(
            _nftContract,
            _tokenId,
            _msgSender(),
            _amountOfToken,
            _price,
            false
        );
        itemIds.increment();
    }

    function buyItemProduct(uint256 itemId_,uint256 _price,address _tokenERc20) public payable{
        uint256 _itemId = itemIds.current();
        require(itemId_ < _itemId, "buyItemProduct: it is not item ");
        product storage item = itemProduct[itemId_];
        if(msg.value>0 && _price==0){
            require(msg.value == item.price,"buyItemProduct : Please Paye Correct Price");
            payments[itemId_].buyer=_msgSender();
            payments[itemId_].price=item.price;
            payments[itemId_].state=false;
            item.tokenErc20=address(0);
            item.sold=true;
            balances[_msgSender()]+=msg.value;
        }else if(msg.value==0 && _price>0){
            require(IERC20(_tokenERc20).allowance(msg.sender, address(this)) >= item.price, "buyItemProduct :Insufficient allowance");
            require(_price == item.price,"buyItemProduct : Please Paye Correct Price");
            payments[itemId_].buyer=_msgSender();
            payments[itemId_].price=item.price;
            payments[itemId_].state=false;
            item.tokenErc20=_tokenERc20;
            item.sold=true;
            balances[_msgSender()]+=item.price;
            IERC20(_tokenERc20).transferFrom(msg.sender, address(this), item.price);
        }
    }

    function withdraw(uint256 itemId_)public {
        uint256 _itemId = itemIds.current();
        require(itemId_ < _itemId, "buyItemProduct: it is not item ");
        product storage item = itemProduct[itemId_];
        peyment storage oneBuyer=payments[itemId_];
        require(_msgSender()==item.owner,"withdraw : only owner");
        if(item.tokenErc20==address(0) && item.sold && !oneBuyer.state){
            oneBuyer.state=true;
            balances[oneBuyer.buyer]-=item.price;
           Address.sendValue(item.owner, item.price); 
            IERC1155(item.nftContract).safeTransferFrom(
            item.owner,
            oneBuyer.buyer,
            item.tokenId,
            item.amountOfToken,
            "0x0"
            );
            item.owner = payable(_msgSender());    
        }else if(item.tokenErc20!=address(0) && item.sold && !oneBuyer.state){
            oneBuyer.state=true;
            balances[oneBuyer.buyer]-=item.price;
           IERC20(item.tokenErc20).transfer(item.owner, item.price);  
            IERC1155(item.nftContract).safeTransferFrom(
            item.owner,
            oneBuyer.buyer,
            item.tokenId,
            item.amountOfToken,
            "0x0"
            );
            item.owner = payable(_msgSender());    
         
        }

    }

    receive() external payable {}

}