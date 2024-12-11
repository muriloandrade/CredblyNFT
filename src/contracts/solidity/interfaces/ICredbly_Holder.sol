//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

interface ICredbly_Holder {
    function registerClient(address _clientAddr) external;
    function registerPendingNfts(bytes32 _hash, address[] memory _nftsAddresses, int64[] memory _nftsSerialNumbers) external;
}
