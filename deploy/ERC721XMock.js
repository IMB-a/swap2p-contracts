module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();
  console.log(tokenXDeployer);

  await deploy("ERC721XMock", {
    from: tokenXDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["ERC721XMock"];
