const contract = { 
    "name": "Credbly_ClientFactory", 
    "id": "0.0.5241047", 
    "address": "0x18b64a7c0AA36Bc45AdA8FB7053573043f7119cC", 
    "transactionHash": "0x366105517ae44978f9f077e80ce801862c60d87404351405c1067a17c91ae5c6", 
    "abi": [
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_baseURI",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "createNewClient",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
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
                    "internalType": "address",
                    "name": "_holder",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "holder",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
}
export default contract;