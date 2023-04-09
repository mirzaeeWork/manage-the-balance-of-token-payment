const { expect } = require("chai");

const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Shop", function () {

  const daiAmount = ethers.utils.parseEther("200");

  before(async () => {

    const ERC1155 = await hre.ethers.getContractFactory("TokenERC1155");
    erc1155 = await ERC1155.deploy();

    await erc1155.deployed();

    const ERC20 = await hre.ethers.getContractFactory("TokenERRC20");
    eRC20 = await ERC20.deploy();

    await eRC20.deployed();


    const Shop = await hre.ethers.getContractFactory("Shop");
    shop = await Shop.deploy(eRC20.address, erc1155.address);

    await shop.deployed();


    [owner, alice, bob, charles] = await ethers.getSigners();

    await Promise.all([
      // eRC20.mint(owner.address, daiAmount),
      eRC20.mint(alice.address, daiAmount),
      eRC20.mint(bob.address, daiAmount),

    ]);

    await erc1155.mint('https://gateway.pinata.cloud/ipfs/QmemMMYzY6U4QtESJro7VqTN5r4kmHgoogj6bdcvWLPEGN', alice.address, 5600, "0x");


  });

  describe("create Item ERC115 and buy item", async () => {
    it("should create item", async () => {
      let price = ethers.utils.parseEther("5")
      await erc1155.connect(alice).setApprovalForAll(shop.address, true)
      idERC1155 = await erc1155.getTokenIdCounter()
      expect(await shop.connect(alice).createItemERC115(idERC1155, 600, price))
        .to.be.ok

      const amount = await erc1155.balanceOf(alice.address, idERC1155)
      expect(Number(amount)).to.eq(5600);
    });

    it("should buy item", async () => {
      let amount_ = ethers.utils.parseEther("5")
        await eRC20.connect(bob).approve(shop.address, amount_)
        expect(await shop.connect(bob).buyItem(0,amount_))
        .to.be.ok
        const amountERC1155 = await erc1155.balanceOf(bob.address, idERC1155)
        expect(Number(amountERC1155)).to.eq(600);
  
        const amountERC20 = await eRC20.balanceOf(bob.address)
        expect(Number(amountERC20))
            .to.be.lessThan(Number(daiAmount))
    })

  });



});
