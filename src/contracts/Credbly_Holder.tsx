const contract = {
    "name": "Credbly_Holder",
    "id": "",
    "address": "",
    "abi": [
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
        }
    ]
}
export default contract;