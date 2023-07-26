// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "../interfaces/IERC20.sol";
import "./TicTacToeGame.sol";
import "../IGame.sol";
import "../Factory.sol";

contract TicTacToeFactory is Factory {

    struct Params {
        uint16 timeoutTime;
        address tokenAddress;
        uint coins;
        uint8 size;
    }

    constructor(address _treasury, uint8 _fee) Factory (_treasury, _fee){
    }

    function createGame(bytes memory data) override external {
        Params memory _params = deserialize(data);
        IGame game = (new TicTacToeGame(address(this), treasury, fee));
        game.init(_params.timeoutTime, _params.tokenAddress, _params.coins, _params.size);
        games.push(game);

        assert(IERC20(_params.tokenAddress).transferFrom(_msgSender(), address(game), _params.coins));

        emit GameCreated(address(game), _msgSender());
    }

    function deserialize(bytes memory data) internal virtual pure returns (Params memory) {
        require(data.length == 37, "Invalid data length"); // 2 bytes (uint16) + 20 bytes (address) + 32 bytes (uint) + 1 byte (uint8) = 37 bytes

        uint16 _timeoutTime;
        address _tokenAddress;
        uint _coins;
        uint8 _size;

        assembly {
            _timeoutTime := mload(add(data, 32))
            _tokenAddress := mload(add(data, 34))
            _coins := mload(add(data, 54))
            _size := mload(add(data, 86))
        }
        return Params(_timeoutTime, _tokenAddress, _coins, _size);
    }
}
