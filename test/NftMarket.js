const { expect } = require("chai");

const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NftMarketPlace", function () {
  async function deployThreContract() {
    const ERC1155 = await hre.ethers.getContractFactory("TokenERC1155");
    const erc1155 = await ERC1155.deploy();

    await erc1155.deployed();

    const ERC721 = await hre.ethers.getContractFactory("TokenERC721");
    const erc721 = await ERC721.deploy();

    await erc721.deployed();

    const MarketNft = await hre.ethers.getContractFactory("JoinMarketNft");
    const marketNft = await MarketNft.deploy();

    await marketNft.deployed();

    console.log(`TokenERC721 deployed to : ${erc721.address}`);
    console.log(`TokenERC1155 deployed to : ${erc1155.address}`);
    console.log(`NftMarket deployed to : ${marketNft.address}`);
    const [addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

    await erc721.connect(addr1).safeMint('https://gateway.pinata.cloud/ipfs/QmemMMYzY6U4QtESJro7VqTN5r4kmHgoogj6bdcvWLPEGN')
    await erc1155.connect(addr1).mint('https://gateway.pinata.cloud/ipfs/QmemMMYzY6U4QtESJro7VqTN5r4kmHgoogj6bdcvWLPEGN', addr1.address, 5600, "0x");

    console.log('------------------------------------------')
    return { erc721, erc1155, marketNft, addr1, addr2, addr3, addr4, addr5 };
  }

  it("should be able create MarketItem and delete MarketItem for both tokens ", async function () {
    console.log('------------------------------------------')
    const { erc721, erc1155, marketNft, addr1, addr2, addr3 } = await loadFixture(deployThreContract);
    const idERC721 = await erc721.getTokenIdCounter()
    const idERC1155 = await erc1155.getTokenIdCounter()
    await marketNft.connect(addr1).createMarketItem(erc721.address, idERC721, 1, ethers.utils.parseEther("0.1"));
    await marketNft.connect(addr1).createMarketItem(erc1155.address, idERC1155, 1500, ethers.utils.parseEther("0.3"));
    await marketNft.connect(addr1).deleteMarketItem(0);
    await marketNft.connect(addr1).deleteMarketItem(1);
  });

  it("should be able to validate Fix Price for both tokens", async function () {
    console.log('------------------------------------------')
    const { erc721, erc1155, marketNft, addr1, addr2, addr3 } = await loadFixture(deployThreContract);
    const idERC721 = await erc721.getTokenIdCounter()
    const idERC1155 = await erc1155.getTokenIdCounter()
    await erc1155.connect(addr1).setApprovalForAll(marketNft.address, true)
    await erc721.connect(addr1).setApprovalForAll(marketNft.address, true)
    await marketNft.connect(addr1).createMarketItem(erc721.address, idERC721, 1, ethers.utils.parseEther("0.1"));
    await marketNft.connect(addr1).createMarketItem(erc1155.address, idERC1155, 1500, ethers.utils.parseEther("0.3"));
    await marketNft.connect(addr2).validateFixPrice(0, { value: ethers.utils.parseEther("0.1") })
    await marketNft.connect(addr2).validateFixPrice(1, { value: ethers.utils.parseEther("0.3") })
    const amount = await erc1155.balanceOf(addr2.address, idERC1155)
    expect(amount.toNumber()).to.equal(1500);
    expect(await erc721.ownerOf(idERC721)).to.equal(addr2.address);
  });

  it("should be able to create action and add bid for action and accept Bid by owner for both tokens", async function () {
    console.log('------------------------------------------')
    const { erc721, erc1155, marketNft, addr1, addr2, addr3, addr4, addr5 } = await loadFixture(deployThreContract);
    const idERC721 = await erc721.getTokenIdCounter()
    const idERC1155 = await erc1155.getTokenIdCounter()
    await erc1155.connect(addr1).setApprovalForAll(marketNft.address, true)
    await erc721.connect(addr1).setApprovalForAll(marketNft.address, true)
    await marketNft.connect(addr1).createMarketItem(erc721.address, idERC721, 1, ethers.utils.parseEther("0.1"));
    await marketNft.connect(addr1).createMarketItem(erc1155.address, idERC1155, 1500, ethers.utils.parseEther("0.3"));
    await marketNft.connect(addr1).createAuctionData(0, 10, 87000);
    await marketNft.connect(addr1).createAuctionData(1, 25, 90000);
    const offerforIdAction0 = await marketNft.getPercentOfThePriceOfAction(0)
    const offerforIdAction1 = await marketNft.getPercentOfThePriceOfAction(1)
    await marketNft.connect(addr2).addBidToNFT(0, { value: offerforIdAction0 })
    await marketNft.connect(addr3).addBidToNFT(0, { value: offerforIdAction0.add(ethers.utils.parseEther("0.1")) })
    await marketNft.connect(addr4).addBidToNFT(1, { value: offerforIdAction1 })
    await marketNft.connect(addr5).addBidToNFT(1, { value: offerforIdAction1.add(ethers.utils.parseEther("0.3")) })


    ethers.provider.send("evm_increaseTime", [90000])   // More than a day
    ethers.provider.send("evm_mine")      // mine the next block

    await marketNft.connect(addr1).acceptBidByOwner(0)
    await marketNft.connect(addr1).acceptBidByOwner(1)

    expect(await erc721.ownerOf(idERC721)).to.equal(addr3.address);
    const amount = await erc1155.balanceOf(addr5.address, idERC1155)
    expect(amount.toNumber()).to.equal(1500);

  });

});
