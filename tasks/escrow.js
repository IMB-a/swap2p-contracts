const { task } = require("hardhat/config");

const { TokenX, TokenY, Swap2p } = require("../constants");

task("escrow", "escrow TokenX TokenY").setAction(async (_, hre) => {
  const ethers = hre.ethers;
  const Swap2pInstance = await ethers.getContractAt("Swap2p", Swap2p);
  const TokenXInstance = await ethers.getContractAt("TokenXMock", TokenX);
  const TokenYInstance = await ethers.getContractAt("TokenYMock", TokenY);

  const { tokenXDeployer, tokenYDeployer } = await getNamedAccounts();
  value = new ethers.BigNumber.from("10").pow(18);

  console.log("mint TokenX for deployer");
  await (
    await TokenXInstance.mint(tokenXDeployer, value, {
      from: tokenXDeployer,
    })
  ).wait();

  console.log("mint TokenY for deployer");
  await (
    await TokenYInstance.mint(
      tokenYDeployer,
      value,
      {
        from: tokenYDeployer,
      }
    )
  ).wait();

  console.log("approve 100 TokenX for Swap2p");
  await (
    await TokenXInstance.approve(Swap2p, value, {
      from: tokenYDeployer,
    })
  ).wait();

  console.log("create Escrow");
  await (
    await Swap2pInstance.createEscrow(
      TokenX,
      value,
      TokenY,
      value,
      tokenYDeployer,
      {
        from: tokenXDeployer,
        value: 10000000000
      }
    )
  ).wait();

  console.log("approve 200 TokenY for Swap2p");
  await (
    await TokenYInstance.approve(Swap2p, value, {
      from: tokenYDeployer,
    })
  ).wait();

  console.log("accept Escrow");
  await (
    await Swap2pInstance.acceptEscrow(0, {
      from: tokenYDeployer,
      gasLimit: 250000,
    })
  ).wait();
});
