module.exports = async ({ deployments: { deploy } }) => {
  const { tokenXDeployer } = await getNamedAccounts();
  console.log(tokenXDeployer);

  await deploy("ERC721YMock", {
    from: tokenXDeployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["ERC721YMock"];
