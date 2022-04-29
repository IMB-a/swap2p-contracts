const { ethers } = require("hardhat");

module.exports = async ({ deployments: { deploy } }) => {
  const { SWAP2P } = require("../constants");
  const { tokenXDeployer } = await getNamedAccounts();

  await deploy("Escrow20To721", {
    from: tokenXDeployer,
    args: [SWAP2P, ethers.BigNumber.from("10000000000")],
    log: true,
  });
};
module.exports.tags = ["Escrow20To721"];
