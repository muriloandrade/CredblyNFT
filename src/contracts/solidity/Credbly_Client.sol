//SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Credbly_HTS.sol";
import "./interfaces/ICredbly_Master.sol";
import "./interfaces/ICredbly_Holder.sol";

contract Credbly_Client is Ownable, Credbly_HTS {

    ICredbly_Master master;
    ICredbly_Holder holder;
    address masterAddr;
    string private baseURI;
    mapping(string  => address) public skuTokenAddr;
    mapping(address => string)  public tokenAddrSku;
    mapping(address => address) public tokenNft;
    mapping(address => address) public nftToken;

    event Withdrawn(address indexed to, uint256 value, uint256 timestamp);
    event TokensConvertedToNFTs(
        address owner,
        address[] tokensAddresses,
        int64[] nftsSerialNumbers,
        uint256 timestamp
    );
    event FeePaid(uint256 amount, uint256 timestamp);
    
    event TokensTransfeered(
        address indexed sender,
        address indexed receiver,
        address[] tokensAddresses,
        int64[] amounts
    );

    modifier onlyHolder() {
        require(msg.sender == address(holder), "Clt: Not allowed");
        _;
    }

    constructor(
        address _masterAddr,
        address _holderAddr,
        string memory _baseURI,
        address _client
    ) Ownable(_masterAddr) {
        master = ICredbly_Master(_masterAddr);
        holder = ICredbly_Holder(_holderAddr);
        masterAddr = _masterAddr;
        baseURI = _baseURI;
        _transferOwnership(_client);
    }

    receive() external payable onlyOwner {}

    function uriAndSku(address nftAddress) external view returns (string memory uri, string memory sku) {        
        
        require(nftToken[nftAddress] != address(0), "Clt: NFT not minted");

        sku = tokenAddrSku[nftToken[nftAddress]];
        uri = string(abi.encodePacked(baseURI, sku, ".json"));            
    }

    function withdraw(address payable _to, uint256 _value) external onlyOwner {
        require(
            address(this).balance >= _value,
            "Clt: The value requested exceeds the balance"
        );
        _to.transfer(_value);
        emit Withdrawn(_to, _value, block.timestamp);
    }

    function mintTokenBatch(string[] memory skus, int64[] memory amounts)
        external
        payable
        onlyOwner
    {
        require(
            skus.length == amounts.length,
            "Clt: Arrays w/ different lengths"
        );
        uint256 mintPrice = master.getMintPrice();
        uint256 totalAmount;
        for (uint64 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Clt: Amount must be positive");
            totalAmount += uint256(uint64(amounts[i]));
        }
        require(
            address(this).balance >= uint256(totalAmount) * mintPrice,
            "Clt: Not enough funds"
        );

        for (uint256 i = 0; i < skus.length; i++) {
            //Create token and NFT if this is the first minting
            address tokenAddr = skuTokenAddr[skus[i]];
            if (tokenAddr == address(0)) {
                IHederaTokenService.HederaToken memory newToken;
                newToken.name = string.concat("Credbly_", skus[i]);
                newToken.symbol = skus[i];
                newToken.treasury = address(this);
                address tokenAddress = _createToken(
                    newToken,
                    msg.value / skus.length / 2
                );

                IHederaTokenService.HederaToken memory newNftToken;
                newNftToken.name = string.concat("Credbly_", skus[i], "_NFT");
                newNftToken.symbol = string.concat(skus[i], "_NFT");
                newNftToken.treasury = address(this);
                address nftAddress = _createNFT(
                    newNftToken,
                    msg.value / skus.length / 2
                );
                tokenNft[tokenAddress] = nftAddress;
                nftToken[nftAddress] = tokenAddress;

                tokenAddr = tokenAddress;
                tokenAddrSku[tokenAddr] = skus[i];
                skuTokenAddr[skus[i]] = tokenAddr;
            }
            _mintToken(tokenAddr, amounts[i], new bytes[](0));
        }
        payFee(mintPrice * totalAmount);
    }

    function _transferTokens(
        address[] memory tokens,
        int64[] memory amounts,
        address receiver
    ) external {
        
        require(
            tokens.length == amounts.length,
            "Clt: Arrays with different lengths"
        );
        
        // The owner already owns the tokens of this contract (treasury)
        require( receiver != owner(), "Clt: Transfer to owner not allowed");        
        
        // If sender is the owner, token belongs to this contract
        address sender = msg.sender == owner() ? address(this) : msg.sender;
        
        for (uint256 i; i < tokens.length; i++) {            
            _transferToken(tokens[i], sender, receiver, amounts[i]);
        }
        master.setAccountKnowsClient(receiver);
        emit TokensTransfeered(sender, receiver, tokens, amounts);
    }

    mapping(address => int64[]) serialNumbers;

    function tokensToNftsPending(
        bytes32 invoice_and_password_hash,
        string[] memory skus,
        int64[] memory amounts
    ) external {
        require(
            skus.length == amounts.length,
            "Clt: Arrays with different lengths"
        );

        //Get total amount to arrays length
        uint256 totalAmount = 0;
        for (uint256 i; i < amounts.length; i++) {
            totalAmount += uint256(int256(amounts[i]));
        }

        // Creates the arrays with the total amount of tokens to be converted
        address[] memory nftsAddresses = new address[](totalAmount);
        int64[] memory nftsSerialNumbers = new int64[](totalAmount);
        address[] memory tokensAddresses = new address[](totalAmount); //only for the event
        uint256 index = 0;

        for (uint256 i; i < skus.length; i++) {
            address tokenAddr = skuTokenAddr[skus[i]];
            address nftAddr = tokenNft[tokenAddr];

            // Before burning, seller transfers the tokens to this contract (treasury)
            // (allowance needed)
            _transferToken(tokenAddr, msg.sender, address(this), amounts[i]);
            _burnToken(tokenAddr, amounts[i], new int64[](0));

            // Empty metadata
            bytes[] memory metadata = new bytes[](1);
            metadata[0] = bytes("");

            // Mint an NFT for each token
            for (int64 j; j < amounts[i]; j++) {

                (, , int64[] memory serialNumber) = _mintToken(nftAddr, 0, metadata);

                for (uint256 k; k < serialNumber.length; k++) {
                    tokensAddresses[index] = tokenAddr;
                    nftsAddresses[index] = nftAddr;
                    nftsSerialNumbers[index++] = serialNumber[k];
                }
            }
        }        
        emit TokensConvertedToNFTs(
            msg.sender,
            tokensAddresses,
            nftsSerialNumbers,
            block.timestamp
        );
        holder.registerPendingNfts(
            invoice_and_password_hash,
            nftsAddresses,
            nftsSerialNumbers
        );
        delete serialNumbers[msg.sender];
    }

    function requestNfts(
        address _receiver,
        address[] memory _nftsAddresses,
        int64[] memory _nftsSerialNumbers
    ) external onlyHolder {
        _transferNfts(_receiver, _nftsAddresses, _nftsSerialNumbers);
    }

    function payFee(uint256 _value) private {
        master.receiveFee{value: _value}();
        emit FeePaid(_value, block.timestamp);
    }
}
