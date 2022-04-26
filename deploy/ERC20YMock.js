module.exports = async ({ deployments: { deploy } }) => {
  const { _, tokenYDeployer } = await getNamedAccounts();

  await deploy("ERC20YMock", {
    from: tokenYDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["ERC20YMock"];
