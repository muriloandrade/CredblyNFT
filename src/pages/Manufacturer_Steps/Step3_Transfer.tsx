import { Box, Button, CircularProgress, FormControl, Grid, InputLabel, Paper, Select, SelectChangeEvent, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { ChangeEvent, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { truncateString } from '../../utils/Utils';
import master from "../../contracts/Credbly_Master";
import { AccountsContext } from '../../context/accountsProvider';
import { ethers } from 'ethers';
import { AccountInfoQuery, ContractCallQuery, ContractExecuteTransaction, ContractFunctionParameters, ContractId, TokenAssociateTransaction, TokenId } from '@hashgraph/sdk';

type Contract = {
  name: string;
  address: string;
}

export default function Step3_Transfer() {

  type Row = {
    sku: string;
    amount: string;
    stock: string;
  }

  const [isLoading, setIsLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);

  const [contracts, setContracts] = useState<Contract[]>();
  const [contractSelected, setContractSelected] = useState(0);
  const [rows, setRows] = useState<Row[]>(new Array<Row>(3).fill({ sku: '', stock: '', amount: '' }));

  const { accounts, selectedAccount, client } = useContext(AccountsContext);
  const address = selectedAccount?.address;
  const [createdEvents, setCreatedEvents] = useState<ethers.Event[] | null>(null);

  useEffect(() => {

    setIsLoading(true);

    const getEvents = async () => {
      const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
      const masterContract = new ethers.Contract(master.address, master.abi, provider);
      const masterBlock = (await provider.getTransactionReceipt(master.transactionHash)).blockNumber

      const clientContractCreatedFilter = address && masterContract.filters.ClientContractCreated(ethers.utils.getAddress(address));
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

    if (createdEvents?.length == 0) toast('No contracts found')

    let _contracts: Contract[] = [];
    createdEvents?.filter((event) => event.args && event.args[0].toUpperCase() == address?.toUpperCase()).map(async (event) => {
      event && event.args && _contracts.push({ name: event.args[2], address: event.args[1] });
    });

    setContracts(_contracts);

  }, [createdEvents]);

  function clearFields() {
    setRows(new Array<Row>(3).fill({ sku: '', stock: '', amount: '' }));
  }

  const handleChange = (event: SelectChangeEvent<number>) => {
    contracts && setContractSelected(event.target.value as number);
  };

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
    const tokens: string[] = new Array<string>();

    try {
      setIsCalling(true);
      if (selectedAccount && contracts && contractSelected != undefined) {

        const contractId = await ContractId.fromEvmAddress(0, 0, contracts[contractSelected].address).populateAccountNum(client!);

        //Get tokens from Retailer's account to further associate, if not yet
        const retailer = accounts![2];
        const retailerInfo = await new AccountInfoQuery()
          .setAccountId(retailer.id!)
          .execute(client!)
        const tokensAlrdyAssocToRetailer = retailerInfo.tokenRelationships;

        for (let i = 0; i < skus.length; i++) {

          //Get tokenAddress by SKU
          const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(500_000)
            .setFunction("skuTokenAddr", new ContractFunctionParameters().addString(skus[i]));
          const contractCallResult = await query.execute(client!);
          const tokenAddress = contractCallResult.getAddress();
          if (Number(tokenAddress) == 0) throw new Error(`Token not found for SKU '${skus[i]}'`)
          const tokenId = TokenId.fromSolidityAddress(tokenAddress);
          tokens.push(tokenAddress);

          //Associate token to Retailer, if not yet
          const isAssociated = tokensAlrdyAssocToRetailer._map.has(tokenId.toString())
          if (!isAssociated) {

            const associateTx = new TokenAssociateTransaction()
              .setAccountId(retailer.id!)
              .setTokenIds([tokenId])
              .freezeWith(client!);

            const associateTxSigned = await associateTx.sign(retailer.privateKey!);
            const associateResponse = await associateTxSigned.execute(client!);
            const associateReceipt = await associateResponse.getReceipt(client!);

            const associateStatus = associateReceipt.status.toString();
            console.log(`Association status of token ${tokenId}:`, associateStatus);
          }
        }
        
        //Batch transfer
        const params = new ContractFunctionParameters()
          .addAddressArray(tokens)
          .addInt64Array(amounts)
          .addAddress(retailer.address!)

        const transferTokensTx = new ContractExecuteTransaction()
          .setContractId(contractId)
          .setGas(5_000_000)
          .setFunction(
            '_transferTokens',
            params
          );

        const transferTokensResponse = client && await transferTokensTx.execute(client);
        const transferTokensReceipt = client && transferTokensResponse && await transferTokensResponse.getReceipt(client);

        console.log("Tokens successfuly transfeered", transferTokensReceipt)
        toast.success("Tokens successfuly transfeered");
        clearFields();        
      }
      else {
        throw new Error("No contract selected");
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
            <InputLabel id="contracts-label">Contract</InputLabel>
            <Select
              labelId="contract-select"
              id="contract-select"
              value={0 || contractSelected}
              onChange={(event) => handleChange(event)}
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
          </FormControl></Box>
      </Grid>
      <Grid item>
        <Box>
          <Grid container spacing={2} direction="column" >

            <Grid item>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="left" sx={{ width: "100%", borderBottom: 0, pl: 0, pt: 0 }}>SKU</TableCell>
                      <TableCell align="center" sx={{ width: "10ch", borderBottom: 0, pt: 0 }}>Amount</TableCell>
                      {/* <TableCell align="center" sx={{ width: "1", border: 0, p: 0, m: 0, }}></TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row: Row, index: number) => {
                      return (
                        <TableRow key={index}>
                          <TableCell align="left" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }}>
                            <TextField
                              value={row.sku}
                              disabled={!client || isCalling || isLoading || !contracts || !contracts[contractSelected] || contractSelected == undefined}
                              sx={{ width: "100%" }} onChange={(e) => handleSkuChange(e, index)}

                            />
                          </TableCell>
                          <TableCell align="center" sx={{ p: 0, borderBottom: 0, bgcolor: "#181818" }}>
                            <TextField value={row.amount}
                              disabled={!client || isCalling || isLoading || !contracts || !contracts[contractSelected] || contractSelected == undefined || row.stock == "0"}
                              onChange={(e) => handleAmountChange(e, index)} />
                          </TableCell>
                        </TableRow>
                      )
                    })}

                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item>

              <Button
                onClick={() => call()}
                disabled={!client || isCalling || isLoading || !contracts || !contracts[contractSelected] || contractSelected == undefined}
                variant="contained"
                color="primary"
                sx={{ width: "100%", minHeight: "40px", maxHeight: "40px" }}>
                {!client ? "Disconnected" : contractSelected == undefined ? "Select contract" : isCalling ? <CircularProgress size="1rem" color="inherit" /> : "Transfer to Retailer"}
              </Button>

            </Grid>

          </Grid>
        </Box>
      </Grid>
    </Grid>
  )
}