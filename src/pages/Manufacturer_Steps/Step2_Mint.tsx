import { Box, FormControl, Grid, InputLabel, Paper, Table, TableCell, TableBody, TableContainer, TableHead, TableRow, TextField, Stack, Button, CircularProgress, Skeleton } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import toast from "react-hot-toast";
import { truncateString } from '../../utils/Utils';
import { ethers } from 'ethers';
import master from "../../contracts/Credbly_Master";
import { AccountsContext } from '../../context/accountsProvider';
import { ContractCallQuery, ContractExecuteTransaction, ContractFunctionParameters, ContractId, Hbar } from '@hashgraph/sdk';

type Contract = {
  name: string;
  address: string;
}

export default function Step2_Mint() {

  type Row = {
    sku: string;
    amount: string;
  }

  const [isLoading, setIsLoading] = useState(true);

  const [contracts, setContracts] = useState<Contract[]>();
  const [contractSelected, setContractSelected] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>(new Array<Row>(3).fill({ sku: '', amount: '' }));
  const [isCalling, setIsCalling] = useState(false);

  const { selectedAccount, client } = useContext(AccountsContext);
  const address = selectedAccount?.address;
  const [createdEvents, setCreatedEvents] = useState<ethers.Event[] | null>(null);

  useEffect(() => {

    setIsLoading(true);

    // Get created contracts events to fulfill the selector
    const getEvents = async () => {
      const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
      const masterContract = new ethers.Contract(master.address, master.abi, provider);
      const masterBlock = (await provider.getTransactionReceipt(master.transactionHash)).blockNumber

      const clientContractCreatedFilter = address && masterContract.filters.ClientContractCreated(ethers.utils.getAddress(address));
      // const rawLogs = await provider.getLogs({ ...clientContractCreatedFilter, fromBlock: 11800000 });
      // const events = await masterContract.queryFilter('ClientContractCreated', 11800000);
      const events = clientContractCreatedFilter && await masterContract.queryFilter(clientContractCreatedFilter, masterBlock);
      events && setCreatedEvents(events)
      setIsLoading(false);
    }

    getEvents().catch(error => {
      toast.error(`An error has occured\nCheck console log`)
      console.log(`Error retrieving events`, error)
      setIsLoading(false)
    });

  }, [selectedAccount]);

  useEffect(() => {

    if (createdEvents?.length == 0) toast(`No contracts found`)

    let _contracts: Contract[] = [];
    createdEvents?.filter((event) => event.args && event.args[0].toUpperCase() == address?.toUpperCase()).map(async (event) => {
      event && event.args && _contracts.push({ name: event.args[2], address: event.args[1] });
    });

    setContracts(_contracts);

  }, [createdEvents])

  const handleSelectedContract = (event: SelectChangeEvent<number>) => {
    contracts && setContractSelected(event.target.value as number);
  };

  function clearFields() {
    setRows(new Array<Row>(3).fill({ sku: '', amount: '' }));
  }

  function handleSkuChange(e: ChangeEvent, index: number) {
    var sku = (e.target as HTMLInputElement).value;

    var result = rows.map((r, i) => {
      if (i == index) return { ...r, sku: sku };
      return r;
    })
    setRows(result);
  }

  function handleAmountChange(e: ChangeEvent, index: number) {
    var amount = (e.target as HTMLInputElement).value;
    if (Number.isNaN(Number(amount))) {
      alert('Amount must be a number');
      amount = "";
    }
    else if (amount && Number(amount) <= 0) {
      alert('Amount must be greater than zero');
      amount = "";
    }
    var result = rows.map((r, i) => {
      if (i == index) return { ...r, amount: amount };
      return r;
    })
    setRows(result);
  }

  async function call() {

    const skus = rows.filter((r) => r.sku && r.amount).map((r) => r.sku);
    const amounts = rows.filter((r) => r.sku && r.amount).map((r) => r.amount);

    try {
      setIsCalling(true);
      client?.setDefaultMaxTransactionFee(new Hbar(20))
      if (contracts && contractSelected != undefined) {

        const id = ContractId.fromEvmAddress(0, 0, contracts[contractSelected].address)

        // Number of tokens to be created, needed to calculate the payable amount
        let numNewTokens = 0;

        // Count 1 new token to be created if token address for the SKU doesn't exist yet
        for (let i = 0; i < skus.length; i++) {
          const skuTokenAddr = new ContractCallQuery()
            .setContractId(id)
            .setGas(2_000_000)
            .setFunction(
              'skuTokenAddr',
              new ContractFunctionParameters().addString(skus[i])
            );
          const skuTokenQueryResult = client && await skuTokenAddr.execute(client);
          const tokenAddr = skuTokenQueryResult?.getAddress(0);
          Number(tokenAddr) === 0 && numNewTokens++;
        }

        // Create (if the case) and mint tokens
        const params = new ContractFunctionParameters()
          .addStringArray(skus)
          .addInt64Array(amounts)

        const mintTokens = new ContractExecuteTransaction()
          .setContractId(id)
          .setGas(8_000_000)
          .setPayableAmount(new Hbar(1 + (14 * numNewTokens)))
          .setFunction(
            'mintTokenBatch',
            params
          );
        const mintTxResponse = client && await mintTokens.execute(client);
        const mintReceipt = client && mintTxResponse && await mintTxResponse.getReceipt(client);

        console.log("Tokens successfuly minted", mintReceipt)
        toast.success("Tokens successfuly minted");
        clearFields();
      }
      else {
        throw new Error("no contract selected");
      }
    } catch (err) {
      console.error("Contract call failure", err);
      toast.error("An error has occured\nCheck console log");
    } finally {
      setIsCalling(false);
    }
  }

  return (

    <Grid container direction="row" justifyContent="space-evenly"
      component={Paper} p={3}>
      <Grid item pt={4}>
        <Box>
          <FormControl sx={{ m: 1, minWidth: 400 }}>
            <InputLabel id="contracts-label">{isLoading ? 'Loading...' : 'Contract'}</InputLabel>
            <Select
              labelId="contract-select"
              id="contract-select"
              value={0 || contractSelected}
              onChange={(event) => handleSelectedContract(event)}
              autoWidth
              label="contracts"
              disabled={isLoading}
              sx={{ bgcolor: "#181818" }}
              autoFocus
            >
              {isLoading ? (
                <MenuItem disabled value={0}>
                  <Skeleton animation="wave" />
                </MenuItem>
              ) : (
                contracts?.map((contract, index: number) => (
                  <MenuItem key={contract.address} value={index}>{contract.name} - {truncateString(contract.address, 6, 4)}</MenuItem>))
              )}
            </Select>
          </FormControl>
        </Box>
      </Grid>
      <Grid item>
        <Box>

          <Grid container spacing={2} direction="column" >
            <Grid item>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="left" sx={{ borderBottom: 0, pl: 0, pt: 0 }}>SKU</TableCell>
                      <TableCell align="right" sx={{ width: "10ch", borderBottom: 0, pt: 0 }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row: Row, index: number) => {
                      return (
                        <TableRow key={index} >
                          <TableCell align="left" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }} >
                            <TextField
                              value={row.sku}
                              disabled={!client || isCalling || isLoading || !contracts || !contracts[contractSelected] || contractSelected == undefined}
                              onChange={(e) => handleSkuChange(e, index)} />
                          </TableCell>
                          <TableCell align="right" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }}>
                            <TextField
                              value={row.amount}
                              disabled={!client || isCalling || isLoading || !contracts || !contracts[contractSelected] || contractSelected == undefined}
                              onChange={(e) => handleAmountChange(e, index)} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item >
              <Stack>

                <Button
                  onClick={() => call()}
                  disabled={!client || isCalling || isLoading || !contracts || !contracts[contractSelected] || contractSelected == undefined}
                  variant="contained"
                  color="secondary"
                  sx={{ width: "100%", minHeight: "45px", maxHeight: "45px" }}>
                  {!client ? "Disconnected" : contractSelected == undefined ? "Select contract" : isCalling ? <CircularProgress size="1rem" color="inherit" /> : "Mint Tokens"}
                </Button>

              </Stack>
            </Grid>
          </Grid>

        </Box>
      </Grid>
    </Grid>
  )
}