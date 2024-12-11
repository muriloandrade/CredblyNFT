const contract = {
    "name": "Credbly_Holder",
    "id": "0.0.5241023",
    "address": "0x1563c6B380AB40Aa51b8D8ad1C4f5fE3D842FB2A",
    "transactionHash": "0x815e9a0c86f342c6f48c850a0d99cca7e20a699240d12411705540e4fa6f0ff9",
    "abi": [
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "_invoiceHash",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "_password",
                    "type": "bytes32"
                }
            ],
            "name": "claimNFTs",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "redeemer",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "seller",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "owner",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "addr",
                            "type": "address"
                        },
                        {
                            "internalType": "int64",
                            "name": "serialNumber",
                            "type": "int64"
                        },
                        {
                            "internalType": "string",
                            "name": "uri",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "sku",
                            "type": "string"
                        }
                    ],
                    "indexed": false,
                    "internalType": "struct Credbly_Holder.NFT[]",
                    "name": "_nfts",
                    "type": "tuple[]"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_timestamp",
                    "type": "uint256"
                }
            ],
            "name": "NftsRedeemed",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                },
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                },
                {
                    "internalType": "bytes",
                    "name": "",
                    "type": "bytes"
                }
            ],
            "name": "onERC1155BatchReceived",
            "outputs": [
                {
                    "internalType": "bytes4",
                    "name": "",
                    "type": "bytes4"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "",
                    "type": "bytes"
                }
            ],
            "name": "onERC1155Received",
            "outputs": [
                {
                    "internalType": "bytes4",
                    "name": "",
                    "type": "bytes4"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "_fromClient",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "address[]",
                    "name": "_nftsAddresses",
                    "type": "address[]"
                },
                {
                    "indexed": false,
                    "internalType": "int64[]",
                    "name": "_nftsSerialNumbers",
                    "type": "int64[]"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "_timestamp",
                    "type": "uint256"
                }
            ],
            "name": "PendingNftsRegistered",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_clientAddr",
                    "type": "address"
                }
            ],
            "name": "registerClient",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "_hash",
                    "type": "bytes32"
                },
                {
                    "internalType": "address[]",
                    "name": "_nftsAddresses",
                    "type": "address[]"
                },
                {
                    "internalType": "int64[]",
                    "name": "_nftsSerialNumbers",
                    "type": "int64[]"
                }
            ],
            "name": "registerPendingNfts",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address payable",
                    "name": "_master",
                    "type": "address"
                }
            ],
            "name": "setMaster",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "_invoiceHash",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "_password",
                    "type": "bytes32"
                }
            ],
            "name": "nftsToAssociate",
            "outputs": [
                {
                    "internalType": "address[]",
                    "name": "nftsAddresses",
                    "type": "address[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes4",
                    "name": "interfaceId",
                    "type": "bytes4"
                }
            ],
            "name": "supportsInterface",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}
export default contract;