import { Box, Button, CircularProgress, FormControl, Grid, MenuItem, Paper, Select, SelectChangeEvent, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
// import { useSDK } from '@thirdweb-dev/react';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Web3 } from 'web3';
import FileUploader from '../components/FileUploader';
import { ContractExecuteTransaction, ContractFunctionParameters, ContractId } from '@hashgraph/sdk';
import { AccountsContext } from '../context/accountsProvider';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import master from "../contracts/Credbly_Master";
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

  const { client } = useContext(AccountsContext);

  // Get all events of contracts created to fulfill the selectors
  useEffect(() => {

    setIsLoading(true);
    const getEvents = async () => {
      const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
      const masterContract = new ethers.Contract(master.address, master.abi, provider);
      const masterBlock = (await provider.getTransactionReceipt(master.transactionHash)).blockNumber
      const events = await masterContract.queryFilter('ClientContractCreated', masterBlock);
      events && setCreatedEvents(events);
      setIsLoading(false);
    }
    getEvents().catch(error => {
      toast.error(`There was an error. Check log.`)
      console.log(error)
      setIsLoading(false)
    });

  }, []);

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
      if (i == index) return { ...r, sku: (e.target as HTMLInputElement).value };
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
          const id = ContractId.fromEvmAddress(0, 0, contracts[i].trim()); // Client contractId
          const params = new ContractFunctionParameters()
            .addBytes32(Buffer.from(hash!.slice(2), 'hex'))
            .addStringArray(skus)
            .addInt64Array(amounts)

          // Convert tokens to NFTs to be claimed
          const mintTokens = new ContractExecuteTransaction()
            .setContractId(id)
            .setGas(5_000_000)
            .setFunction(
              'tokensToNftsPending',
              params
            );
          const txResponse = client && await mintTokens.execute(client);
          const receipt = client && txResponse && await txResponse.getReceipt(client);

          console.log("NFTs sent to Holder", receipt)
          toast.success("Success. NFTs available to be claimed");
          clearFields();
        }
      }
    } catch (err) {
      console.error("Contract call failure", err);
      toast.error("An error has occured\nCheck console log");
    } finally {
      setIsCalling(false);
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
                            autoWidth
                            disabled={isLoading}
                            sx={{ bgcolor: "#181818" }}
                            autoFocus
                          >
                            {isLoading ? (
                              <MenuItem disabled value={'0'}>
                                <Skeleton animation="wave" />
                              </MenuItem>
                            ) : (
                              createdEvents?.map((event) => (
                                <MenuItem key={event.args![2]} value={event.args![1]}>{event.args![2]}</MenuItem>))
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
            {!client ? "Disconnected" : isCalling ? <CircularProgress size="1rem" color="inherit" /> : "Send NFT"}
          </Button>
        </Stack>

      </Grid>

    </Grid>
  )
}