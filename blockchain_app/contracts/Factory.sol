// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./IGame.sol";
import "./IFactory.sol";
import "./utils/Ownable.sol";
import "./utils/Context.sol";

contract Factory is IFactory, Ownable {
    IGame[] public games;
    address public immutable treasury;
    uint public birthdayBlock;
    uint8 public immutable fee;

    event GameCreated(address game, address creator);

    constructor(address _treasury, uint8 _fee){
        treasury = _treasury;
        fee = _fee;
        birthdayBlock = block.number;
    }

    function _msgSender() internal view override(Context) returns (address) {
        return Context._msgSender();
    }

    function createGame(bytes memory data) virtual external {
    }

    function currentTime() external view returns (uint256){
        return block.timestamp;
    }

}
