// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Escrow20To20 is AccessControl {
    struct Escrow {
        address xOwner;
        address xTokenContractAddr;
        uint256 xAmount;
        address yOwner;
        address yTokenContractAddr;
        uint256 yAmount;
        bool closed;
    }

    Escrow[] public escrowList;
    address public sppAddress;
    uint256 public fee;

    event EscrowCreated(
        address xOwner,
        address xTokenContractAddr,
        uint256 xAmount,
        address yOwner,
        address yTokenContractAddr,
        uint256 yAmount,
        uint256 escrowIndex
    );

    event EscrowAccepted(uint256 escrowIndex, address yOwner);
    event EscrowCanceled(uint256 escrowIndex);

    constructor(address _sppAddress, uint256 _fee) {
        sppAddress = _sppAddress;
        fee = _fee;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

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

        IERC20 spp = IERC20(sppAddress);
        require(spp.balanceOf(msg.sender) >= fee, "not enough SPP");

        IERC20 xToken = IERC20(_xTokenContractAddr);
        if (_xTokenContractAddr == sppAddress) {
            require(
                xToken.balanceOf(msg.sender) >= _xAmount + fee,
                "not enough SPP"
            );
        } else {
            require(
                xToken.balanceOf(msg.sender) > _xAmount,
                "not enough xToken"
            );
        }

        escrowList.push(
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
        uint256 escrowIndex = escrowList.length - 1;

        xToken.transferFrom(msg.sender, address(this), _xAmount);
        spp.transferFrom(msg.sender, address(this), fee);

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
            escrowList[_escrowIndex].xOwner == msg.sender,
            "you'r isn't escrow owner"
        );
        require(
            escrowList[_escrowIndex].closed == false,
            "escrow already closed"
        );

        escrowList[_escrowIndex].closed = true;
        emit EscrowCanceled(_escrowIndex);
    }

    function acceptEscrow(uint256 _escrowIndex) external {
        IERC20 xToken = IERC20(escrowList[_escrowIndex].xTokenContractAddr);
        IERC20 yToken = IERC20(escrowList[_escrowIndex].yTokenContractAddr);
        require(escrowList[_escrowIndex].closed == false, "escrow closed");
        require(
            escrowList[_escrowIndex].yOwner == address(0) ||
                escrowList[_escrowIndex].yOwner == msg.sender,
            "escrow not for you"
        );
        require(
            yToken.balanceOf(msg.sender) > escrowList[_escrowIndex].yAmount,
            "not enough yToken"
        );

        escrowList[_escrowIndex].closed = true;

        xToken.transfer(msg.sender, escrowList[_escrowIndex].xAmount);
        yToken.transferFrom(
            msg.sender,
            address(this),
            escrowList[_escrowIndex].yAmount
        );
        yToken.transfer(
            escrowList[_escrowIndex].xOwner,
            escrowList[_escrowIndex].yAmount
        );

        emit EscrowAccepted(_escrowIndex, msg.sender);
    }

    function setFee(uint256 _newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fee = _newFee;
    }

    function claimFee(address _to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(_to).transfer(address(this).balance);
    }

    function getEscrow(uint256 _escrowIndex)
        public
        view
        returns (Escrow memory)
    {
        require(escrowList.length > 0, "no escrows");
        require(
            _escrowIndex < escrowList.length,
            "Id must be < escrows length"
        );

        return escrowList[_escrowIndex];
    }
}
