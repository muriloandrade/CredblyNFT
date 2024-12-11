//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import "./Credbly_Client.sol";

contract Credbly_ClientFactory {
    
    address owner;
    address payable master;
    address public holder;

    constructor(address _holder) {
        owner = msg.sender;
        holder = _holder;
    }

    function createNewClient(string memory _baseURI, address _owner)
        external
        returns (address)
    {
        require(msg.sender == master, "Fct: Only master");
        Credbly_Client newClient = new Credbly_Client(master, holder, _baseURI, _owner);
        return address(newClient);
    }

    function setMaster(address payable _master) external {
        require(msg.sender == owner, "Fct: Not allowed");
        master = _master;
    }
}
