import { Button, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import { ethers } from 'ethers';
import { ChangeEvent, Fragment, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import FileUploader from '../components/FileUploader';
import NftsTable from '../components/NftsTable';

import holder from "../contracts/Credbly_Holder";

import toast from 'react-hot-toast';
import { AccountsContext } from '../context/accountsProvider';
import { AccountInfoQuery, ContractCallQuery, ContractExecuteTransaction, ContractFunctionParameters, TokenAssociateTransaction, TokenId } from '@hashgraph/sdk';
import { NftType } from '../components/NftCard';
import { logError, logTransactionLink } from '../utils/general';
import { getAndSetNFTsRedeemedEvents } from '../utils/hedera';

export default function FinalConsumer() {

  const [isLoading, setIsLoading] = useState(true);
  const [invoice, setInvoice] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [nfts, setNfts] = useState<NftType[]>();
  const [flagNftsRedeemed, setFlagNftsRedeemed] = useState(0);

  const { accounts, selectedAccount, client, updateBalances } = useContext(AccountsContext);
  const address = selectedAccount?.address;

  useEffect(() => {
    clearFields();
    // Get events from Holder of NFTs redeemed by the costumer
    address && getAndSetNFTsRedeemedEvents(setIsLoading, setNfts, address)

  }, [selectedAccount, flagNftsRedeemed]);

  function clearFields() {
    setInvoice('');
    setPassword('');
  }

  function handlePasswordChange(e: ChangeEvent) {
    setPassword((e.target as HTMLInputElement).value);
  }

  async function call() {

    // Hash of the invoice and Hash of the password (to be sent separately)
    const web3 = new Web3();
    const invoiceHash = web3.utils.soliditySha3({ type: "string", value: invoice });
    const passwordHash = web3.utils.soliditySha3({ type: "string", value: password });

    try {
      setIsLoading(true);

      const id = holder.id;
      const params = new ContractFunctionParameters()
        .addBytes32(Buffer.from(invoiceHash!.slice(2), 'hex'))
        .addBytes32(Buffer.from(passwordHash!.slice(2), 'hex'))

      // Get a list of NFT addresses to be associated to the costumer
      const nftsToAssociate = new ContractCallQuery()
        .setContractId(id)
        .setGas(1_000_000)
        .setFunction(
          'nftsToAssociate',
          params
        );
      const contractCallResult = await nftsToAssociate.execute(client!);
      const resultBytes = contractCallResult.asBytes();
      const iface = new ethers.utils.Interface(holder.abi);
      //Array of addresses (may contain duplicates)
      const decoded = iface.decodeFunctionResult("nftsToAssociate", resultBytes)[0];
      //Retrieve the unique addresses
      const addresses = (decoded as Array<string>).filter((value, index, self) => self.indexOf(value) === index);

      //Get tokens from consumer's account to further associate, if not yet
      const consumer = accounts![3];
      const consumerInfo = await new AccountInfoQuery()
        .setAccountId(consumer.id!)
        .execute(client!)
      const tokensAlrdyAssocToConsumer = consumerInfo.tokenRelationships;

      const toAssociate: TokenId[] = addresses
        .map((value) => TokenId.fromSolidityAddress(value)) //convert to TokenId
        .filter((value) => !tokensAlrdyAssocToConsumer._map.has(value.toString())) //keep if not associated

      // Associates necessary NFT addresses
      if (toAssociate.length != 0) {
        const associateTx = new TokenAssociateTransaction()
          .setAccountId(consumer.id!)
          .setTokenIds(toAssociate)
          .freezeWith(client!);

        const associateTxSigned = await associateTx.sign(consumer.privateKey!);
        const associateTxResponse = await associateTxSigned.execute(client!);
        logTransactionLink('tokenAssociate', associateTxResponse!.transactionId!);

        const associateReceipt = await associateTxResponse.getReceipt(client!);

        const associateStatus = associateReceipt.status.toString();
        console.log(`Association status of NFT Ids ${toAssociate}:`, associateStatus);

      } else {
        console.log(`NFTs addresses already associated`)
      }

      // Claim NFTs from Holder
      const claimNFTsTx = new ContractExecuteTransaction()
        .setContractId(id)
        .setGas(3_000_000)
        .setFunction(
          'claimNFTs',
          params
        );
      const claimTxResponse = client && await claimNFTsTx.execute(client);
      logTransactionLink('claimNFTs', claimTxResponse!.transactionId!);

      const claimReceipt = client && claimTxResponse && await claimTxResponse.getReceipt(client);

      // Wait 6 seconds to update node
      await new Promise(resolve => setTimeout(resolve, 6000));

      console.log("NFTs successfuly withdrawn", claimReceipt);
      toast.success("NFTs successfuly withdrawn");      
      setFlagNftsRedeemed(flagNftsRedeemed + 1)
      clearFields();

    } catch (error) {
      logError(error);
    } finally {
      setIsLoading(false);
      updateBalances!();
    }
  }

  return (
    <Fragment>

      <Stack
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={3}
        height="100%"
        divider={<Divider orientation="horizontal" flexItem />}
        sx={{ mb: 10 }}
      >

        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}>
          <FileUploader setInvoice={setInvoice} />
          <TextField label="Password" value={password} onChange={(event) => handlePasswordChange(event)} size="small" type="password" sx={{ width: '15ch' }} />

          <Button
            onClick={() => call()}
            disabled={isLoading || isLoading || !client || !invoice || !password}
            variant="contained"
            color="primary"
            sx={{ width: "20ch", minHeight: "45px", maxHeight: "45px" }}>
            {!client ? "Disconnected" : isLoading ? <CircularProgress size="1rem" color="inherit" /> : "Claim NFTs"}
          </Button>
        </Stack>
        {isLoading ? <CircularProgress /> : nfts && nfts.length > 0 ? <NftsTable nfts={nfts} /> : <Typography color={'grey'} >No NFTs for {selectedAccount?.name} account</Typography>}

      </Stack>
    </Fragment>
  )
}
