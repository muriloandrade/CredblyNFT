//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICredbly_ClientFactory.sol";
import "./interfaces/ICredbly_Holder.sol";

contract Credbly_Master is Ownable {
    uint256 public mintPrice = 10;
    ICredbly_ClientFactory private clientFactory;
    ICredbly_Holder private holder;

    struct Client {
        uint256 contractsCount;
        mapping(uint256 => address) contracts;
    }

    mapping(address => Client) clients;
    mapping(address => bool) activeContracts;

    string[] uris = ["0"];

    event ClientContractCreated(
        address indexed client,
        address indexed contractAddress,
        string name,
        string uri,
        uint256 index,
        uint256 timestamp
    );
    event MintPriceUpdated(
        uint256 previousPrice,
        uint256 newPrice,
        uint256 timestamp
    );

    modifier onlyAllowed() {
        require(activeContracts[msg.sender], "Mst: Not allowed");
        _;
    }

    constructor(address _clientFactoryAddr, address _holderAddr)
        Ownable(msg.sender)
    {
        clientFactory = ICredbly_ClientFactory(_clientFactoryAddr);
        holder = ICredbly_Holder(_holderAddr);
    }

    receive() external payable onlyOwner {}

    function setClientFactory(address _clientFactoryAddr) external onlyOwner {
        clientFactory = ICredbly_ClientFactory(_clientFactoryAddr);
    }

    function setHolder(address _holderAddr) external onlyOwner {
        holder = ICredbly_Holder(_holderAddr);
    }

    function receiveFee() external payable onlyAllowed {}

    function withdraw(address payable _to, uint256 _value) external onlyOwner {
        require(
            address(this).balance >= _value,
            "Mst: The value requested exceeds the balance"
        );
        _to.transfer(_value);
    }

    function getActiveContract(address _addr) external view returns (bool) {
        return activeContracts[_addr];
    }

    function setMintPrice(uint256 _value) external onlyOwner {
        uint256 prev = mintPrice;
        mintPrice = _value;
        emit MintPriceUpdated(prev, _value, block.timestamp);
    }

    function getMintPrice() external view returns (uint256) {
        return mintPrice;
    }

    function createContract(string calldata _name, string calldata _uri)
        external
    {
        require(validateUri(_uri));
        string memory baseURI = _uri[:strlen(_uri) - 10];
        address newClientAddr = clientFactory.createNewClient(
            baseURI,
            msg.sender
        );
        Client storage client = clients[msg.sender];
        client.contracts[client.contractsCount] = newClientAddr;
        activeContracts[newClientAddr] = true;
        uris.push(_uri);
        holder.registerClient(newClientAddr);
        emit ClientContractCreated(
            msg.sender,
            newClientAddr,
            _name,
            _uri,
            client.contractsCount,
            block.timestamp
        );
        client.contractsCount++;
    }

    function validateUri(string calldata _uri) private view returns (bool) {
        require(uriExists(_uri) == 0, "Mst: URI already exists");
        uint256 uriLen = strlen(_uri);
        require(
            uriLen > 11 && sameStrings(_uri[uriLen - 11:], "/{sku}.json"),
            "Mst: URI malformed. Must end with /{sku}.json"
        );
        return true;
    }

    function uriExists(string memory _uri) private view returns (uint256) {
        bool found = false;
        uint256 i;
        for (i = 0; i < uris.length && !found; i++) {
            if (sameStrings(uris[i], _uri)) {
                found = true;
                break;
            }
        }
        return found ? i : 0;
    }

    function sameStrings(string memory s1, string memory s2)
        private
        pure
        returns (bool same)
    {
        same =
            keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
        return same;
    }

    function getContractById(uint256 _id) external view returns (address) {
        require(
            clients[msg.sender].contracts[_id] != address(0),
            "Contract not found"
        );
        return clients[msg.sender].contracts[_id];
    }

    // For development purposes
    function resetUris() external onlyOwner {
        delete uris;
    }

    /**
     * @dev Returns the length of a given string
     *
     * @param s The string to measure the length of
     * @return The length of the input string
     */
    // Source: https://github.com/ensdomains/ens-contracts/blob/master/contracts/ethregistrar/StringUtils.sol
    function strlen(string memory s) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }
}