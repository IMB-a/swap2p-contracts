module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();
  console.log(tokenXDeployer);

  await deploy("TokenXMock", {
    from: tokenXDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["TokenX"];
