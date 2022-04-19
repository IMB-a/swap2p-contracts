module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();

  await deploy("Swap2p", {
    from: tokenXDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["Swap2p"];
