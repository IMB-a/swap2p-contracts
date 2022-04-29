const { ethers } = require("hardhat");

module.exports = async ({ deployments: { deploy } }) => {
  const { SWAP2P } = require("../constants");
  const { tokenXDeployer } = await getNamedAccounts();

  await deploy("Escrow721To20", {
    from: tokenXDeployer,
    args: [SWAP2P, ethers.BigNumber.from("10000000000")],
    log: true,
  });
};
module.exports.tags = ["Escrow721To20"];
