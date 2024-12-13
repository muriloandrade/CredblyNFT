import { Button, CircularProgress, Paper, Stack, TextField } from "@mui/material";
import { useState, useContext } from 'react';

import toast from "react-hot-toast";

import master from "../../contracts/Credbly_Master";

import { ContractFunctionParameters, ContractExecuteTransaction } from "@hashgraph/sdk";
import { AccountsContext } from "../../context/accountsProvider";
import ContractsTable from "../../components/ContractsTable";
import { logError, logTransactionLink } from "../../utils/general";

export type Contract = {
  address: string;
  name: string;
  uri: string;
  balance?: string;
}

export default function Step1_CreateContract() {

  const [uri, setUri] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flagCreated, setFlagCreated] = useState(0)
  
  const { client, updateBalances } = useContext(AccountsContext);

  function clearFields() {
    setUri("");
    setName("");
    setFlagCreated(flagCreated + 1)
  }

  const call = async (_name: string, _uri: string) => {
    setIsLoading(true);
    try {
      //Create contract transaction
      const params = new ContractFunctionParameters().addString(_name).addString(_uri);
      const transaction = new ContractExecuteTransaction()
        .setContractId(master.id)
        .setGas(15_000_000)
        .setFunction('createContract', params)        
        
        //Sign with the client operator private key to pay for the transaction and submit the query to a Hedera network
        const txResponse = client && await transaction.execute(client);      
        logTransactionLink('createContract', txResponse!.transactionId!); 

      //Request the receipt of the transaction
      const receipt = client && txResponse && await txResponse.getReceipt(client);
      console.log(`Contract successfuly created.`, receipt);
      toast.success("Contract successfuly created.");
      clearFields();

    } catch (error) {
      logError(error);
    } finally {
      setIsLoading(false);
      updateBalances!();
    }
  }

  return (
    <Stack
      direction="column"
      width="100%"
      component={Paper}
    >
      <Stack
        direction="row"
        width="100%"
        component={Paper}
        sx={{ p: 2 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
          width="100%"
        >

          <Stack direction="column" spacing={2} >
            <TextField
              id="contract_name"
              label="Contract Name"
              onChange={(e) => setName(e.target.value)}
              placeholder="YourBrand - Product line"
              variant="outlined"
              sx={{ width: '50ch', bgcolor: "#181818" }}
              value={name}
              autoFocus />
            <TextField
              id="contract_uri"
              label="Contract URI"
              onChange={(e) =>
                setUri(e.target.value)}
              placeholder="https://your_domain.com/{sku}.json"
              variant="outlined"
              sx={{ width: '50ch', bgcolor: "#181818" }}
              value={uri}
              autoFocus />
          </Stack>
          <Stack direction="row" spacing={2} >

            <Button
              onClick={() => call(name, uri)}
              disabled={!client || isLoading}
              variant="contained"
              color="primary"
              sx={{ width: "25ch", minHeight: "50px", maxHeight: "50px" }}>
              {isLoading ? <CircularProgress size="1.5rem" color="inherit" /> : "Create contract"}
            </Button>

          </Stack>
        </Stack >
      </Stack>

      {/* Table of client's created contracts */}
      <ContractsTable flagCreated={flagCreated} />

    </Stack>
  )
}

