const hre = require("hardhat");

async function main() {
  const ERC1155 = await hre.ethers.getContractFactory("TokenERC1155");
  const erc1155 = await ERC1155.deploy();

  await erc1155.deployed();

  const ERC20 = await hre.ethers.getContractFactory("TokenERRC20");
  const eRC20 = await ERC20.deploy();

  await eRC20.deployed();

  const Shop = await hre.ethers.getContractFactory("Shop");
  const shop = await Shop.deploy(eRC20.address,erc1155.address);

  await shop.deployed();



  console.log(
    `eRC20 deployed to : ${eRC20.address}`
  );
  console.log(
    `erc1155 deployed to : ${erc1155.address}`
  );
  console.log(
    `shop deployed to : ${shop.address}`
  );

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
