import { Box, Button, CircularProgress, FormControl, Grid, MenuItem, Paper, Select, SelectChangeEvent, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Web3 } from 'web3';
import FileUploader from '../components/FileUploader';
import { AccountAllowanceApproveTransaction, AccountId, ContractCallQuery, ContractExecuteTransaction, ContractFunctionParameters, ContractId, TokenId } from '@hashgraph/sdk';
import { AccountsContext } from '../context/accountsProvider';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import { logError, logTransactionLink, truncateString } from '../utils/general';
import { getKnownClients } from '../utils/hedera';
// @ts-ignore
window.Buffer = Buffer;


export default function Retailer() {

  type Row = {
    contract: string;
    sku: string;
    amount: string;
    stock: string;
  }

  const [isLoading, setIsLoading] = useState(true);

  const [rows, setRows] = useState<Row[]>(new Array<Row>(4).fill({ contract: '', sku: '', amount: '', stock: '' }));
  const [isCalling, setIsCalling] = useState(false);
  const [invoice, setInvoice] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [createdEvents, setCreatedEvents] = useState<ethers.Event[] | null>(null);

  const { client, selectedAccount, updateBalances } = useContext(AccountsContext);

  // Get all events of contracts created to fulfill the selectors
  useEffect(() => {

    getKnownClients(setIsLoading, setCreatedEvents, client!);

  }, [client]);

  function clearFields() {
    setPassword('');
    setRows(new Array<Row>(4).fill({ contract: '', sku: '', amount: '', stock: '' }));
  }

  const handleContractSelected = (event: SelectChangeEvent<string>, index: number) => {
    var result = rows.map((r, i) => {
      if (i == index) return { ...r, contract: (event.target as HTMLInputElement).value };
      return r;
    })
    setRows(result);
  };

  function handleSkuChange(e: ChangeEvent, index: number) {
    var result = rows.map((r, i) => {
      if (i == index) return { ...r, sku: (e.target as HTMLInputElement).value.trim() };
      return r;
    })
    setRows(result);
  }

  function handleAmountChange(e: ChangeEvent, index: number) {
    var result = rows.map((r, i) => {
      if (i == index) return { ...r, amount: (e.target as HTMLInputElement).value };
      return r;
    })
    setRows(result);
  }

  function handlePasswordChange(e: ChangeEvent) {

    setPassword((e.target as HTMLInputElement).value);
  }

  async function call() {

    const contracts: string[] = rows.filter((row) => row.contract && row.sku && row.amount).map((r) => r.contract.trim()).filter((r, i, a) => a.indexOf(r) === i)

    // Unique hash of invoice/password
    const web3 = new Web3();
    const invoiceHash = web3.utils.soliditySha3({ type: "string", value: invoice });
    const passwordHash = web3.utils.soliditySha3({ type: "string", value: password });
    const hash = web3.utils.soliditySha3({ type: "bytes", value: invoiceHash }, { type: "bytes", value: passwordHash });

    let success = true;
    try {
      setIsCalling(true);
      for (let i = 0; i < contracts.length; i++) {

        let skus: string[] = [];
        let amounts: number[] = [];

        // Will send only if 'SKU' && 'Amount' is filled
        rows.forEach(row => {
          if (contracts[i] === row.contract && row.sku.trim().length != 0 && Number(row.amount) > 0) {
            skus.push(row.sku);
            amounts.push(Number(row.amount));
          }
        })

        if (skus.length != 0) {
          const contractId = await ContractId.fromEvmAddress(0, 0, contracts[i].trim()).populateAccountNum(client!); // Client contractId

          // For each SKU of same contract...
          for (let j = 0; j < skus.length; j++) {

            //Get tokenAddress by SKU
            const query = new ContractCallQuery()
              .setContractId(contractId)
              .setGas(500_000)
              .setFunction("skuTokenAddr", new ContractFunctionParameters().addString(skus[j]));
            const contractCallResult = await query.execute(client!);
            const tokenAddress = contractCallResult.getAddress();
            if (Number(tokenAddress) == 0) throw new Error(`Token not found for SKU '${skus[j]}'`)
            const tokenId = TokenId.fromSolidityAddress(tokenAddress);

            // Before being burned, tokens must return to the contract (treasury)
            // So, the seller must allow the transfer
            const allowTx = new AccountAllowanceApproveTransaction()
              .approveTokenAllowance(tokenId, selectedAccount!.id as AccountId, `0.0.${contractId.num}`, amounts[j])
              .freezeWith(client!)
            const signAllowTx = await allowTx.sign(selectedAccount!.privateKey!);
            const allowTxResponse = await signAllowTx.execute(client!);
            logTransactionLink('allowanceApprove', allowTxResponse!.transactionId!); 
            const allowTxReceipt = await allowTxResponse.getReceipt(client!);
            const transactionStatus = allowTxReceipt.status;
            console.log(`Allowance status for token ${tokenId}: ` + transactionStatus.toString());
          }

          // Convert tokens to NFTs to be claimed
          const params = new ContractFunctionParameters()
            .addBytes32(Buffer.from(hash!.slice(2), 'hex'))
            .addStringArray(skus)
            .addInt64Array(amounts)

          const tokensToNftTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(5_000_000)
            .setFunction(
              'tokensToNftsPending',
              params
            );
          const tokensToNftTxResponse = await tokensToNftTx.execute(client!);
          logTransactionLink('tokensToNftsPending', tokensToNftTxResponse!.transactionId!);

          const tokenToNftTxReceipt = tokensToNftTxResponse && await tokensToNftTxResponse.getReceipt(client!);
          console.log("NFTs sent to Holder", tokenToNftTxReceipt)
        }
      }
    } catch (error) {
      logError(error);
      success = false;
    } finally {
      setIsCalling(false);
      updateBalances!();
      if (success) {
        toast.success("Success. NFTs available to be claimed");
        clearFields();
      }
    }
  }

  return (

    <Grid container direction="column" alignItems="center"
      justifyContent="flex-end" component={Paper} p={3} ml={-2} spacing={4} >

      <Grid item>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left" sx={{ width: "60ch", borderBottom: 0, pl: 0, pt: 0 }}>Contract</TableCell>
                <TableCell align="left" sx={{ width: "20ch", borderBottom: 0, pl: 0, pt: 0 }}>SKU</TableCell>
                <TableCell align="center" sx={{ width: "10ch", borderBottom: 0, pt: 0 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>

              {rows.map((row: Row, index: number) => {
                return (
                  <TableRow key={index}>
                    <TableCell align="left" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }}>
                      <Box>
                        <FormControl sx={{ m: 0, width: "100%" }}>

                          {/* Contract Selector */}
                          <Select
                            id={`contract-select-${index}`}
                            value={isLoading ? '0' : rows[index].contract}
                            onChange={(event) => handleContractSelected(event, index)}
                            autoWidth={false}
                            fullWidth
                            disabled={isLoading}
                            sx={{ bgcolor: "#181818" }}
                            autoFocus
                          >
                            {isLoading ? (
                              <MenuItem disabled value={'0'}>
                                <Skeleton animation="wave" />
                              </MenuItem>
                            ) : (
                              createdEvents && createdEvents.length > 0 ? (createdEvents.map((event) => (
                                <MenuItem key={event.args![2]} value={event.args![1]}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                                    <span>{event.args![2]}</span>
                                    <span>{truncateString(event.args![1], 6, 4)}</span>
                                  </Box>
                                </MenuItem>)
                              )) : (
                                <MenuItem disabled value={'0'}>
                                  No contracts related to {selectedAccount?.name} account
                                </MenuItem>)
                            )}
                          </Select>
                        </FormControl>
                      </Box>
                    </TableCell>

                    <TableCell align="left" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }}>
                      <TextField value={row.sku} sx={{ width: "100%" }} disabled={isLoading} onChange={(e) => handleSkuChange(e, index)} /></TableCell>
                    <TableCell align="center" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }}>
                      <TextField value={row.amount} disabled={isLoading} onChange={(e) => handleAmountChange(e, index)} /></TableCell>
                  </TableRow>
                )
              })}

            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Invoice and password to be hashed */}
      <Grid item>
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}>
          <FileUploader setInvoice={setInvoice} />
          <TextField
            label="Password"
            value={password}
            onChange={(event) => handlePasswordChange(event)}
            size="small"
            type="password"
            sx={{ width: '15ch' }} />

          <Button
            onClick={() => call()}
            disabled={!client || isCalling || !invoice || !password || isLoading}
            variant="contained"
            color="primary"
            sx={{ width: "15ch", minHeight: "45px", maxHeight: "45px" }}>
            {!client ? "Disconnected" : isCalling ? <CircularProgress size="1rem" color="inherit" /> : "Send NFTS"}
          </Button>
        </Stack>

      </Grid>

    </Grid>
  )
}