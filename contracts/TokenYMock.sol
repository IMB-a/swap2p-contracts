//SPDX-License-Identifier: No License (None)
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenYMock is ERC20, AccessControl {
    constructor() ERC20("TokenY", "Y") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
