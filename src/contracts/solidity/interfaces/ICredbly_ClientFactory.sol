//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

interface ICredbly_ClientFactory {
  function createNewClient(string memory _baseURI, address _owner) external returns(address); 
}