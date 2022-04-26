module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();
  console.log(tokenXDeployer);

  await deploy("ERC20XMock", {
    from: tokenXDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["ERC20XMock"];
