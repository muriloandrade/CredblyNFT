import { Button, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material';
import { Event, BigNumber, ethers } from 'ethers';
import { ChangeEvent, Fragment, useContext, useEffect, useRef, useState } from 'react';
import Web3 from 'web3';
import FileUploader from '../components/FileUploader';
import NftsTable from '../components/NftsTable';

import holder from "../contracts/Credbly_Holder";

import toast from 'react-hot-toast';
import { AccountsContext } from '../context/accountsProvider';
import { AccountInfoQuery, ContractCallQuery, ContractExecuteTransaction, ContractFunctionParameters, TokenAssociateTransaction, TokenId } from '@hashgraph/sdk';
import { NftType } from '../components/NftCard';

export default function FinalConsumer() {

  const [isLoading, setIsLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);

  const [invoice, setInvoice] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [nfts, setNfts] = useState<NftType[]>();
  const [flagNftsRedeemed, setFlagNftsRedeemed] = useState(0);

  const { accounts, selectedAccount, client } = useContext(AccountsContext);
  const address = selectedAccount?.address;

  useEffect(() => {
    clearFields();
    setIsLoading(true);

    let _nfts: NftType[] = [];

    // Get events from Holder of NFTs redeemed by the costumer
    const getEvents = async () => {
      const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
      const holderContract = new ethers.Contract(holder.address, holder.abi, provider);
      const holderBlock = (await provider.getTransactionReceipt(holder.transactionHash)).blockNumber
      const nftsRedeemedFilter = address && holderContract.filters.NftsRedeemed(ethers.utils.getAddress(address));
      const events: string | Array<Event> | undefined = nftsRedeemedFilter && await holderContract.queryFilter(nftsRedeemedFilter, holderBlock);

      if (events && Array.isArray(events) && events.length > 0) {

        events.map(e => {
          const timestamp = (e.args![2] as BigNumber).toNumber();

          // NFTs objects from the event
          (e.args![1] as NftType[]).filter((nft) => nft.owner.toUpperCase() == address?.toUpperCase()).map((nft) => {
            let _nft: NftType = { ...nft, timestamp: timestamp }
            _nfts.push(_nft);
          })
        })
        _nfts.length > 0 && setNfts(_nfts);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    getEvents().catch(error => {
      toast.error(`There was an error. Check log.`)
      console.log(error)
      setIsLoading(false)
    });

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
      setIsCalling(true);

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
        const associateResponse = await associateTxSigned.execute(client!);
        const associateReceipt = await associateResponse.getReceipt(client!);

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
      const claimReceipt = client && claimTxResponse && await claimTxResponse.getReceipt(client);

      // Wait 5 seconds to update node
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log("NFTs successfuly withdrawn", claimReceipt);
      toast.success("NFTs successfuly withdrawn");      
      setFlagNftsRedeemed(flagNftsRedeemed + 1)
      clearFields();

    } catch (err) {
      console.error("Contract call failure", err);
      toast.error("An error has occured\nCheck console log");
    } finally {
      setIsCalling(false);
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
            disabled={isLoading || isCalling || !client || !invoice || !password}
            variant="contained"
            color="primary"
            sx={{ width: "20ch", minHeight: "45px", maxHeight: "45px" }}>
            {!client ? "Disconnected" : isCalling ? <CircularProgress size="1rem" color="inherit" /> : "Claim NFTs"}
          </Button>
        </Stack>
        {isLoading ? <CircularProgress /> : nfts && nfts.length > 0 ? <NftsTable nfts={nfts} /> : <Typography color={'grey'} >No NFTs for the selected account</Typography>}

      </Stack>
    </Fragment>
  )
}
