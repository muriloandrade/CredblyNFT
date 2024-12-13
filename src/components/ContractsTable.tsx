import { Button, CircularProgress, Link, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState, useContext, useMemo } from 'react';
import { copyToClipboard, logError, logTransactionLink } from '../utils/general';
import { ContractId, ContractInfoQuery, ContractInfo, ContractExecuteTransaction, ContractFunctionParameters, Hbar } from "@hashgraph/sdk";
import { AccountsContext } from '../context/accountsProvider';
import { getAndSetClientContractCreatedEvents } from '../utils/hedera';
import toast from 'react-hot-toast';

type Contract = {
  address: string;
  name: string;
  uri: string;
  balance?: Hbar;
}

interface ContractsTableProps {
  flagCreated: number;
}

export default function ContractsTable(props: ContractsTableProps) {
  const { flagCreated } = props;

  const [isLoading, setIsLoading] = useState(true);

  const [rows, setRows] = useState<Contract[]>();
  const [createdEvents, setCreatedEvents] = useState<ethers.Event[] | null>(null);

  const { selectedAccount, client, updateBalances: updateAccountsBalances } = useContext(AccountsContext);
  const address = selectedAccount?.address;

  // Loads contracts creation events when account or flag changes
  useEffect(() => {

    address && getAndSetClientContractCreatedEvents(setIsLoading, setCreatedEvents, address)

  }, [flagCreated, selectedAccount]);

  // Function to obtain contracts balance asynchronously
  const getBalances = useCallback(async (promises: Promise<ContractInfo>[], _rows: Contract[]) => {
    Promise.all(promises).then((result) => {
      const __rows: Contract[] = [];
      _rows?.map((row, index) => {
        const balance = result[index].balance;
        if (balance != undefined)
          __rows.push({ ...row, balance: balance })
      })
      __rows.length > 0 && setRows(__rows);
    });
  }, [rows]);

  // Memoize filtered events to avoid re-computation
  const filteredEvents = useMemo(() => {
    return createdEvents?.filter(event =>
      event.args && event.args[0].toUpperCase() === address?.toUpperCase()
    );
  }, [createdEvents, address]);

  // Updates contracts balances
  const updateBalance: any = useCallback(() => {
    let _promises: Promise<ContractInfo>[] = [];
    let _rows: Contract[] = [];

    filteredEvents?.map(async (event, index) => {
      let row = rows && event.args && { ...rows[index], address: event.args[1], name: event.args[2], uri: event.args[2] };
      row && _rows.push(row);

      const contractInfo = event.args && client && new ContractInfoQuery().setContractId(ContractId.fromEvmAddress(0, 0, event.args[1])).execute(client);
      contractInfo && _promises.push(contractInfo);
    });

    setRows(_rows);
    getBalances(_promises, _rows);

  }, [createdEvents, address]);

  useEffect(() => {
    updateBalance();
  }, [createdEvents, address])

  useEffect(() => {
    rows?.length && rows.length > 0 && setIsLoading(false);
  }, [rows])


  async function withdrawBalance(balance: Hbar, address: string) {
    console.log(balance.toTinybars().toNumber())
    setIsLoading(true);
    try {
      //Create contract transaction
      const params = new ContractFunctionParameters().addAddress(selectedAccount!.address!).addUint256(balance.toTinybars().toNumber());
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromEvmAddress(0, 0, address))
        .setGas(15_000_000)
        .setFunction('withdraw', params)

      //Sign with the client operator private key to pay for the transaction and submit the query to a Hedera network
      const txResponse = client && await transaction.execute(client);
      logTransactionLink('withdraw', txResponse!.transactionId!);

      //Request the receipt of the transaction
      const receipt = client && txResponse && await txResponse.getReceipt(client);
      console.log(`Successfully withdrawn from ${address}.`, receipt);
      toast.success("Successfully withdrawn");

    } catch (error) {
      logError(error);
    } finally {
      setIsLoading(false);
      updateAccountsBalances!();
      updateBalance();
    }
  }

  return (
    <TableContainer component={Paper} sx={{ width: '100%' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="left" sx={{ color: "gray" }}>Name</TableCell>
            <TableCell align="center" sx={{ color: "gray" }}>Address</TableCell>
            <TableCell align="right" sx={{ color: "gray" }}>Balance (wei)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>

          {isLoading && (
            <TableRow>
              <TableCell align="left"><Typography variant="h5" ><Skeleton animation="wave" /></Typography></TableCell>
              <TableCell align="center"><Typography variant="h5" ><Skeleton animation="wave" /></Typography></TableCell>
              <TableCell align="right"><Typography variant="h5" ><Skeleton animation="wave" /></Typography></TableCell>
            </TableRow>
          )}

          {!isLoading && rows && rows.length == 0 ? <TableRow><TableCell colSpan={4} ><Typography color={'grey'}>No contracts for {selectedAccount?.name} account</Typography></TableCell></TableRow> : rows?.map((row) => <TableRow key={row.address} >
            <TableCell align="left"><Tooltip title={row.uri}><Typography color="gray">{row.name}</Typography></Tooltip></TableCell>
            <TableCell align="center"><Tooltip title="click to copy"><Button variant="text" sx={{ typography: 'body1', fontFamily: 'monospace' }} onClick={() => copyToClipboard(row.address)}>{row.address}</Button></Tooltip></TableCell>
            <TableCell align="right" width={200} >

              {row.balance && !isLoading ? (

                row.balance.toBigNumber().toNumber() > 0 ? (
                <Tooltip title="Withdraw" followCursor >
                  <Link href="#" onClick={() => withdrawBalance(row!.balance!, row.address)} sx={{ textDecoration: 'none' }} >
                    <Typography color="gray">{row.balance.toString()}</Typography>
                  </Link>
                </Tooltip>

                ) : (
                    <Typography color="gray">{row.balance.toString()}</Typography>
                )
              ) : (
                <Typography color="gray">{<CircularProgress size="1.5rem" color="inherit" />}</Typography>
              )}

            </TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>)
}

