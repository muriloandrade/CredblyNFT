//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import "./interfaces/ICredbly_Client.sol";

contract Credbly_Holder {
    
    address owner;
    address master;

    struct PendingNFTs {
        bool validHash;
        address[] clients;
        mapping(address client => address[] nftAddress) nftsAddresses;
        mapping(address client => int64[] nftSerialNumbers) nftsSerialNumbers;
    }

    struct NFT {
        address seller;
        address owner;
        address addr;
        int64 serialNumber;
        string uri;
        string sku;
    }
    mapping(bytes32 hash => PendingNFTs) hashesNFTs;
    mapping(address _contract => bool allowed) allowedClientsContracts;

    event PendingNftsRegistered(address _fromClient, address[] _nftsAddresses, int64[] _nftsSerialNumbers, uint _timestamp);
    event NftsRedeemed(address indexed redeemer, NFT[] _nfts, uint _timestamp);

    constructor() {
        owner = msg.sender;
    }

    function setMaster(address payable _master) external {
        require(msg.sender == owner, "Hld: Only owner");
        master = _master;
    }

    function registerClient(address _clientAddr) external {
        require(msg.sender == master, "Hld: Not allowed");
        allowedClientsContracts[_clientAddr] = true;
    }

    function registerPendingNfts(bytes32 _hash, address[] memory _nftsAddresses, int64[] memory _nftsSerialNumbers) external {
        require(allowedClientsContracts[msg.sender], "Hld: Only client's contracts");
        hashesNFTs[_hash].validHash = true;
        hashesNFTs[_hash].clients.push(msg.sender);
        hashesNFTs[_hash].nftsAddresses[msg.sender] = _nftsAddresses;
        hashesNFTs[_hash].nftsSerialNumbers[msg.sender] = _nftsSerialNumbers;
       
        emit PendingNftsRegistered(msg.sender, _nftsAddresses, _nftsSerialNumbers, block.timestamp);
    }

    mapping(address consumer => NFT[]) _nfts;
    
    // Future implementation: Sponsored function
    function claimNFTs(bytes32 _invoiceHash, bytes32 _password) 
        external
    {
        bytes32 hash_ = keccak256(abi.encodePacked(_invoiceHash, _password));
        PendingNFTs storage hashPendingNFTs = hashesNFTs[hash_];
        require(hashPendingNFTs.validHash != false, "Hld: Invalid invoice hash or password.");
        
        for(uint i = 0; i < hashPendingNFTs.clients.length; i++) {
            ICredbly_Client client = ICredbly_Client(hashPendingNFTs.clients[i]);

            address[] memory nftsAddresses = hashPendingNFTs.nftsAddresses[address(client)];
            int64[] memory nftsSerialNumbers = hashPendingNFTs.nftsSerialNumbers[address(client)];
            for (uint j = 0; j < nftsAddresses.length; j++) {
                NFT memory nft;
                nft.seller = address(client);
                nft.owner = msg.sender;
                nft.addr = nftsAddresses[j];
                nft.serialNumber = nftsSerialNumbers[j];
                (nft.uri, nft.sku) = client.uriAndSku(nftsAddresses[j]);
                _nfts[msg.sender].push(nft);
            }

            client.requestNfts(msg.sender, nftsAddresses, nftsSerialNumbers);
            delete hashPendingNFTs.nftsAddresses[address(client)];
            delete hashPendingNFTs.nftsSerialNumbers[address(client)];
        }        
        hashPendingNFTs.validHash = false;
        delete hashPendingNFTs.clients;
        emit NftsRedeemed(msg.sender, _nfts[msg.sender], block.timestamp);
        delete _nfts[msg.sender];
    }

    mapping(address caller => address[] addresses) addrsToAssociate;
    function nftsToAssociate(bytes32 _invoiceHash, bytes32 _password) 
        external view
        returns (address[] memory nftsAddresses)
    {
        bytes32 hash_ = keccak256(abi.encodePacked(_invoiceHash, _password));
        PendingNFTs storage hashPendingNFTs = hashesNFTs[hash_];
        require(hashPendingNFTs.validHash != false, "Hld: Invalid invoice hash or password.");

        uint arraySize = 0;
        for (uint i; i < hashPendingNFTs.clients.length; i++) 
        {
            address client = hashPendingNFTs.clients[i];
            for (uint j; j < hashPendingNFTs.nftsAddresses[client].length; j++) 
            {
                arraySize++;
            }
        }

        address[] memory _addrs = new address[](arraySize);
        uint index = 0;
        for (uint i; i < hashPendingNFTs.clients.length; i++) 
        {
            address client = hashPendingNFTs.clients[i];
            for (uint j; j < hashPendingNFTs.nftsAddresses[client].length; j++) 
            {
                address addr = hashPendingNFTs.nftsAddresses[client][j];
                _addrs[index++] = addr;
            }
        }
        nftsAddresses = _addrs;
    }
}