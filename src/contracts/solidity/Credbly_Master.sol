//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICredbly_ClientFactory.sol";
import "./interfaces/ICredbly_Holder.sol";

contract Credbly_Master is Ownable {
    uint256 public mintPrice = 10;
    ICredbly_ClientFactory private clientFactory;
    ICredbly_Holder private holder;

    //for testers
    string public appUrl = "https://credbly-nft.vercel.app/";

    struct Client {
        uint256 contractsCount;
        mapping(uint256 id => address) contracts;
    }

    mapping(address owner => Client) clients;
    mapping(address _contract => bool active) activeContracts;
    mapping(address account => address[] clients) accountKnowsClients;
    mapping(address _contract => string name) clientName;

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

    function setAppUrl(string memory _newAppUrl) external onlyOwner {
        appUrl = _newAppUrl;
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
        if (sameStrings(appUrl, substring(_uri, 0, strlen(appUrl)))) return 0;
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
            "Mst: Contract not found"
        );
        return clients[msg.sender].contracts[_id];
    }

    // Whether the account has ever received a token from the Client
    function setAccountKnowsClient(address account) external onlyAllowed {

        bool alreadyKnown;
        address[] memory accountKnownClients = accountKnowsClients[account];
        for (uint256 i = 0; i < accountKnownClients.length; i++) {
            if (accountKnownClients[i] == msg.sender) {
                alreadyKnown = true;
            }
        }
        if (!alreadyKnown) accountKnowsClients[account].push(msg.sender);
    }

    function getKnownClients() external view returns ( address[] memory ) {
        return accountKnowsClients[msg.sender];
    }

    function substring(string memory str, uint start, uint length) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(start + length <= strBytes.length, "Clt: string out of bounds");        
        bytes memory result = new bytes(length);
        
        for (uint i = 0; i < length; i++) {
            result[i] = strBytes[start + i];
        }
        
        return string(result);
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