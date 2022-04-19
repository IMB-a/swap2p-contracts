//SPDX-License-Identifier: No License (None)
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Swap2p {
    struct Escrow {
        address xOwner;
        address xTokenContractAddr;
        uint256 xAmount;
        address yOwner;
        address yTokenContractAddr;
        uint256 yAmount;
        bool closed;
    }

    Escrow[] public escrowsList;

    mapping(address => uint256[]) public ownerTokens;

    event EscrowCreated(
        address xOwner,
        address xTokenContractAddr,
        uint256 xAmount,
        address yOwner,
        address yTokenContractAddr,
        uint256 yAmount,
        uint256 escrowIndex
    );

    event EscrowAccepted(uint256 escrowIndex);
    event EscrowCanceled(uint256 escrowIndex);

    function createEscrow(
        address _xTokenContractAddr,
        uint256 _xAmount,
        address _yTokenContractAddr,
        uint256 _yAmount,
        address _yOwner
    ) external {
        require(_xTokenContractAddr != address(0), "x zero address");
        require(_yTokenContractAddr != address(0), "y zero address");
        require(_xAmount > 0, "x zero amount");
        require(_yAmount > 0, "y zero amount");

        IERC20 xToken = IERC20(_xTokenContractAddr);
        require(xToken.balanceOf(msg.sender) > _xAmount, "not enought xToken");

        escrowsList.push(
            Escrow({
                xOwner: msg.sender,
                xTokenContractAddr: _xTokenContractAddr,
                xAmount: _xAmount,
                yOwner: _yOwner,
                yTokenContractAddr: _yTokenContractAddr,
                yAmount: _yAmount,
                closed: false
            })
        );
        uint256 escrowIndex = escrowsList.length - 1;

        xToken.transferFrom(msg.sender, address(this), _xAmount);

        emit EscrowCreated(
            msg.sender,
            _xTokenContractAddr,
            _xAmount,
            _yOwner,
            _yTokenContractAddr,
            _yAmount,
            escrowIndex
        );
    }

    function cancelEscrow(uint256 _escrowIndex) external {
        require(
            escrowsList[_escrowIndex].xOwner == msg.sender,
            "invoker isn't escrow owner"
        );
        require(escrowsList[_escrowIndex].closed == false, "escrow already closed");

        escrowsList[_escrowIndex].closed = true;
        emit EscrowCanceled(_escrowIndex);
    }

    function acceptEscrow(uint256 _escrowIndex) external {
        IERC20 xToken = IERC20(escrowsList[_escrowIndex].xTokenContractAddr);
        IERC20 yToken = IERC20(escrowsList[_escrowIndex].yTokenContractAddr);
        require(escrowsList[_escrowIndex].closed == false, "escrow closed");
        require(
            yToken.balanceOf(msg.sender) > escrowsList[_escrowIndex].yAmount,
            "not enought yToken"
        );

        escrowsList[_escrowIndex].closed = true;

        xToken.transfer(msg.sender, escrowsList[_escrowIndex].xAmount);
        yToken.transferFrom(
            msg.sender,
            address(this),
            escrowsList[_escrowIndex].yAmount
        );
        yToken.transfer(
            escrowsList[_escrowIndex].xOwner,
            escrowsList[_escrowIndex].yAmount
        );

        emit EscrowAccepted(_escrowIndex);
    }
}
