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
npm run-script deploy:rinkeby
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

# Using example
```bash
npx hardhat escrow --network rinkeby
```