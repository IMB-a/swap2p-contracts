module.exports = async ({ deployments: { deploy } }) => {
  const { _, tokenYDeployer } = await getNamedAccounts();

  await deploy("TokenYMock", {
    from: tokenYDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["TokenY"];
