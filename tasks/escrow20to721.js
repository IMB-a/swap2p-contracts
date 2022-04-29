const { task } = require("hardhat/config");

const { ERC20X, ERC721Y, SWAP2P, ESCROW20TO721 } = require("../constants");

task("escrow20to721", "escrow TokenX TokenY").setAction(async (_, hre) => {
  const ethers = hre.ethers;
  const Swap2pInstance = await ethers.getContractAt("Swap2p", SWAP2P);
  const ERC20XInstance = await ethers.getContractAt("ERC20XMock", ERC20X);
  const ERC721YInstance = await ethers.getContractAt("ERC721YMock", ERC721Y);
  const Escrow20TO721Instance = await ethers.getContractAt(
    "Escrow20To721",
    ESCROW20TO721
  );

  const { tokenXDeployer, tokenYDeployer } = await getNamedAccounts();
  value = new ethers.BigNumber.from("10").pow(18);
  yTokenIndex = 0;

  console.log("123");
  console.log(
    await ERC20XInstance.balanceOf(tokenXDeployer, {
      from: tokenXDeployer,
    })
  );

  console.log("mint Swap2p for deployer");
  tx = await Swap2pInstance.mint(tokenXDeployer, value, {
    from: tokenXDeployer,
  });
  console.log(tx);
  await tx.wait();

  console.log("mint TokenX for deployer");
  tx = await ERC20XInstance.mint(tokenXDeployer, value, {
    from: tokenXDeployer,
  });
  console.log(tx);
  await tx.wait();

  console.log("mint TokenX for deployer");
  console.log(
    await (
      await ERC20XInstance.mint(tokenXDeployer, value, {
        from: tokenXDeployer,
      })
    ).wait()
  );

  console.log("mint TokenY for deployer");
  console.log(
    await (
      await ERC721YInstance.mint(tokenYDeployer, {
        from: tokenYDeployer,
      })
    ).wait()
  );

  console.log("approve 100 TokenX for Swap2p");
  console.log(
    await (
      await ERC20XInstance.approve(ESCROW20TO721, value, {
        from: tokenYDeployer,
      })
    ).wait()
  );

  console.log("create Escrow");
  console.log(
    await (
      await Escrow20TO721Instance.createEscrow(
        ERC20X,
        value,
        ERC721Y,
        yTokenIndex,
        tokenYDeployer,
        {
          from: tokenXDeployer,
          gasLimit: 250000,
          value: 10000000000,
        }
      )
    ).wait()
  );

  console.log("approve 200 TokenY for Swap2p");
  console.log(
    await (
      await ERC721YInstance.approve(ESCROW20TO721, yTokenIndex, {
        from: tokenYDeployer,
      })
    ).wait()
  );

  console.log("accept Escrow");
  console.log(
    await (
      await Escrow20TO721Instance.acceptEscrow(0, {
        from: tokenYDeployer,
        gasLimit: 250000,
      })
    ).wait()
  );
});
