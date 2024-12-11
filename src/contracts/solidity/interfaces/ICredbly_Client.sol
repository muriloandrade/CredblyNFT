//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

interface ICredbly_Client {
    function requestNfts(address _receiver, address[] memory _nftsAddresses, int64[] memory _nftsSerialNumbers) external;
    function uriAndSku(address nftAddress) external view returns (string memory uri, string memory sku);
    
}