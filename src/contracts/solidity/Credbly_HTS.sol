// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./hedera/hedera-token-service/HederaTokenService.sol";
import "./hedera/hedera-token-service/ExpiryHelper.sol";
import "./hedera/hedera-token-service/KeyHelper.sol";
import "./hedera/hedera-token-service/FeeHelper.sol";

contract Credbly_HTS is HederaTokenService, ExpiryHelper, KeyHelper, FeeHelper {
    event ResponseCode(int256 responseCode);
    event CreatedToken(address tokenAddress);
    event TransferToken(address tokenAddress, address receiver, int64 amount);
    event MintedToken(int64 newTotalSupply, int64[] serialNumbers);
    event TokenInfo(IHederaTokenService.TokenInfo tokenInfo);

    function _createToken(IHederaTokenService.HederaToken memory token, uint256 msgValue)
        internal
        returns (address tokenAddress)
    {
        IHederaTokenService.TokenKey[]
            memory keys = new IHederaTokenService.TokenKey[](3);
        keys[0] = getSingleKey(
            KeyType.ADMIN,
            KeyType.PAUSE,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );
        keys[1] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );
        keys[2] = getSingleKey(
            KeyType.FEE,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0,
            address(this),
            8000000
        );

        token.tokenKeys = keys;
        token.expiry = expiry;

        int256 responseCode;
        (responseCode, tokenAddress) = HederaTokenService.createFungibleToken(
            token,
            0,
            0,
            msgValue
        );
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Hts: Failed to create token");
        }
        emit CreatedToken(tokenAddress);
    }

    function _createNFT(IHederaTokenService.HederaToken memory nftToken, uint256 msgValue)
        internal
        returns (address tokenAddress)
    {
        IHederaTokenService.TokenKey[]
            memory keys = new IHederaTokenService.TokenKey[](3);
        keys[0] = getSingleKey(
            KeyType.ADMIN,
            KeyType.PAUSE,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );
        keys[1] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );
        keys[2] = getSingleKey(
            KeyType.FEE,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0,
            address(this),
            8000000
        );

        nftToken.tokenKeys = keys;
        nftToken.expiry = expiry;

        int256 responseCode;
        (responseCode, tokenAddress) = HederaTokenService.createNonFungibleToken(nftToken, msgValue);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Hts: Failed to create NFT");
        }
        emit CreatedToken(tokenAddress);
    }

    function _mintToken(
        address token,
        int64 amount,
        bytes[] memory metadata
    )
        internal
        returns (
            int256 responseCode,
            int64 newTotalSupply,
            int64[] memory serialNumbers
        )
    {
        (responseCode, newTotalSupply, serialNumbers) = HederaTokenService
            .mintToken(token, amount, metadata);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Hts: Failed to mint token");
        }

        emit MintedToken(newTotalSupply, serialNumbers);
    }

    function _getTokenInfo(address token)
        internal
        returns (
            int256 responseCode,
            IHederaTokenService.TokenInfo memory tokenInfo
        )
    {
        (responseCode, tokenInfo) = HederaTokenService.getTokenInfo(token);

        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Hts: Failed to get token info");
        }

        emit TokenInfo(tokenInfo);
    }

    function _burnToken(
        address token,
        int64 amount,
        int64[] memory serialNumbers
    ) internal {
        (int256 responseCode, ) = HederaTokenService.burnToken(
            token,
            amount,
            serialNumbers
        );
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Hts: Failed to burn token");
        }
    }

    function _transferToken(address token, address sender, address receiver, int64 amount) internal returns (int responseCode) {
        responseCode = HederaTokenService.transferToken(token, sender, receiver, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
    
    //State variables for _transferNfts
    mapping(address receiver => address[] nftAddress) addr;
    mapping(address receiver => int64[] serialNumbers) sns; //serial numbers
    
    //Recursive function
    function _transferNfts(
        address receiver,
        address[] memory addresses,
        int64[] memory serialNumbers
    ) public {

        if (addresses.length == 1) {

            address[] memory _sender = new address[](serialNumbers.length);
            address[] memory _receiver = new address[](serialNumbers.length);
            
            for (uint i; i < serialNumbers.length ; i++) 
            {
                _sender[i] = address(this);
                _receiver[i] = receiver;                
            }            

            int256 responseCode = HederaTokenService.transferNFTs(
                addresses[0],
                _sender,
                _receiver,
                serialNumbers
            );

            if (responseCode != HederaResponseCodes.SUCCESS) {
                revert("Hts: Failed to transfer NFTs");
            }

        } else {

            address[] storage _addr = addr[receiver];
            int64[] storage _sns = sns[receiver];

            for (uint256 i = 0; i < addresses.length; i++) {
                
                //first iteration, push anyway
                if (i == 0) {
                    _addr.push(addresses[i]);
                }
                
                //push SN if the same address 
                if (_addr[_addr.length-1] == addresses[i]) _sns.push(serialNumbers[i]);
                
                //transfer if not the same address or is the last iteration
                if (_addr[_addr.length-1] != addresses[i] || i == addresses.length-1) {
                    _transferNfts(receiver, _addr, _sns);
                    delete addr[receiver];
                    delete sns[receiver];
                    _addr.push(addresses[i]);
                    _sns.push(serialNumbers[i]);
                }                
            }
        }
    }
}
