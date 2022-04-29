module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();
  console.log(tokenXDeployer);

  await deploy("Swap2p", {
    from: tokenXDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["Swap2p"];
