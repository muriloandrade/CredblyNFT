//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

interface ICredbly_Master {
    function getMintPrice() external view returns (uint);
    function receiveFee() payable external;
    function setAccountKnowsClient(address) external;
}