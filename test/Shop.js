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
        shop = await Shop.deploy();

        await shop.deployed();


        [owner, alice, bob, charles] = await ethers.getSigners();

        await Promise.all([
            eRC20.mint(owner.address, daiAmount),
            eRC20.mint(alice.address, daiAmount),
            eRC20.mint(bob.address, daiAmount),

        ]);
        a = alice.address
        await erc1155.mint('https://gateway.pinata.cloud/ipfs/QmemMMYzY6U4QtESJro7VqTN5r4kmHgoogj6bdcvWLPEGN', alice.address, 5600, "0x");

    });

    describe("create Item ERC115 and buy item", async () => {
        it("should create item", async () => {

            let price0 = ethers.utils.parseEther("6")
            let price1 = ethers.utils.parseEther("2")

            await erc1155.connect(alice).setApprovalForAll(shop.address, true)
            idERC1155 = await erc1155.getTokenIdCounter()
            expect(await shop.connect(alice).createItemProduct(erc1155.address, idERC1155, 600, price0))
                .to.be.ok
            expect(await shop.connect(alice).createItemProduct(erc1155.address, idERC1155, 200, price1))
                .to.be.ok


            const amount = await erc1155.balanceOf(alice.address, idERC1155)
            expect(Number(amount)).to.eq(5600);
        });

        it("should buy item and withdraw by ERC20 Token", async () => {
            let price = ethers.utils.parseEther("6")

            await eRC20.connect(bob).approve(shop.address, price)
            expect(await shop.connect(bob).buyItemProduct(0, price, eRC20.address))
                .to.be.ok
            expect(await shop.connect(alice).withdraw(0))
                .to.be.ok

            const amountERC1155 = await erc1155.balanceOf(bob.address, idERC1155)
            expect(Number(amountERC1155)).to.eq(600);

            const balanceBobERC20 = await eRC20.balanceOf(bob.address)
            expect(Number(balanceBobERC20))
                .to.be.lessThan(Number(daiAmount))

            const balanceAliceERC20 = await eRC20.balanceOf(alice.address)
            expect(Number(daiAmount))
                .to.be.lessThan(Number(balanceAliceERC20))
        })

        it("should buy item and withdraw by ETH", async () => {
            let price = ethers.utils.parseEther("2")
            const balanceCharlesAccountBefore= await shop.getBalanaceAddress(charles.address)
            expect(await shop.connect(charles).buyItemProduct(1, 0, eRC20.address,{value: price}))
                .to.be.ok
            expect(await shop.connect(alice).withdraw(1))
                .to.be.ok

            const amountERC1155 = await erc1155.balanceOf(charles.address, idERC1155)
            expect(Number(amountERC1155)).to.eq(200);

            const balanceCharlesAccountAfter= await shop.getBalanaceAddress(charles.address)
            expect(Number(balanceCharlesAccountAfter))
                .to.be.lessThan(Number(balanceCharlesAccountBefore))

            const balanceAliceERC20 = await eRC20.balanceOf(alice.address)
            expect(Number(daiAmount))
                .to.be.lessThan(Number(balanceAliceERC20))
        })


    });



});
