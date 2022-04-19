const { task } = require("hardhat/config");

const { TokenX, TokenY, Swap2p } = require("../constants");

task("escrow", "escrow TokenX TokenY").setAction(async (_, hre) => {
  const ethers = hre.ethers;
  const Swap2pInstance = await ethers.getContractAt("Swap2p", Swap2p);
  const TokenXInstance = await ethers.getContractAt("TokenXMock", TokenX);
  const TokenYInstance = await ethers.getContractAt("TokenYMock", TokenY);

  const { tokenXDeployer, tokenYDeployer } = await getNamedAccounts();

  console.log("mint TokenX for deployer");
  await (
    await TokenXInstance.mint(tokenXDeployer, 1000, {
      from: tokenXDeployer,
    })
  ).wait();

  console.log("mint TokenY for deployer");
  await (
    await TokenYInstance.mint(tokenYDeployer, 1000, {
      from: tokenYDeployer,
    })
  ).wait();

  console.log("approve 100 TokenX for Swap2p");
  await (
    await TokenXInstance.approve(Swap2p, 100, {
      from: tokenYDeployer,
    })
  ).wait();

  console.log("create Escrow");
  await (
    await Swap2pInstance.createEscrow(
      TokenX,
      100,
      TokenY,
      200,
      "0xA3c45c542ceF281842e4956D0f70F398cC9d2798",
      {
        from: tokenXDeployer,
      }
    )
  ).wait();

  console.log("approve 200 TokenY for Swap2p");
  await (
    await TokenYInstance.approve(Swap2p, 200, {
      from: tokenYDeployer,
    })
  ).wait();

  console.log("accept Escrow");
  await (
    await Swap2pInstance.acceptEscrow(0, {
      from: tokenYDeployer,
    })
  ).wait();
});
