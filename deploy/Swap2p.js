const { ethers } = require("hardhat");

module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();

  await deploy("Swap2p", {
    from: tokenXDeployer,
    args: [ethers.BigNumber.from("10000000000")],
    log: true,
  });
};
module.exports.tags = ["Swap2p"];
