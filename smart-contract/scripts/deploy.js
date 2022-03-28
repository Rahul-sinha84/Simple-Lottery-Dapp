const hre = require("hardhat");

const main = async () => {
  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(500);

  await lottery.deployed();

  console.log(`Lottery contract deployed to: ${lottery.address}`);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
