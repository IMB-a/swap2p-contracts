# Swap2p

![](https://img.shields.io/badge/build%20with-openzeppelin-blue.svg?style=flat-square)
[![Test](https://github.com/Pod-Box/swap2p-contracts/actions/workflows/test.yml/badge.svg)](https://github.com/Pod-Box/swap2p-contracts/actions/workflows/test.yml)
![Solidity](https://img.shields.io/badge/solidity-v0.8.13-green)

Escrow, which allows you to securely exchange erc-20 tokens. Using it you can open position, that can be fulfilled by any other person, or a specific one.

## Install
```bash
npm install
```

## Deploy
```bash
npx hardhat deploy --network rinkeby --tags Swap2p --reset
```
fill swap2p contract address in `constants.js`
```js
const SWAP2P = "";
```
After that deploy other contracts

```bash
npx hardhat deploy --network rinkeby --tags ERC20XMock
npx hardhat deploy --network rinkeby --tags ERC20YMock
npx hardhat deploy --network rinkeby --tags ERC721XMock
npx hardhat deploy --network rinkeby --tags ERC721YMock
npx hardhat deploy --network rinkeby --tags Escrow20To20
npx hardhat deploy --network rinkeby --tags Escrow721To20
npx hardhat deploy --network rinkeby --tags Escrow20To721
npx hardhat deploy --network rinkeby --tags Escrow721To721
```

## Verify
```bash
npm run-script verify:rinkeby
```

## Test
```bash
npm run-script test
npm run-script coverage
```

## Using example
after deploy all contract fill contract addresses in `constants.js`
```js
const ERC20X = "";
const ERC721Y = "";
const ESCROW20TO721 = "";
```
After that run task
```bash
npx hardhat escrow20to721 --network rinkeby
```