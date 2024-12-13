import React, { useCallback, useContext, useEffect } from 'react';
import { MenuItem, Box, Skeleton, FormControl, InputLabel, Select, IconButton, SelectChangeEvent } from '@mui/material';
import RestartAlt from '@mui/icons-material/RestartAlt';
import { truncateString } from '../utils/general';
import { AccountsContext } from '../context/accountsProvider';
import { getAndSetClientContractCreatedEvents } from '../utils/hedera';
import { ethers } from 'ethers';

interface Contract {
  address: string;
  name: string;
}

interface SelectContractProps {
  isLoading: boolean;
  contracts?: Contract[];
  contractSelected: number;
  setContractSelected: (index: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setCreatedEvents: (events: ethers.Event[] | null) => void;
}

const SelectContract: React.FC<SelectContractProps> = ({
  isLoading,
  contracts,
  contractSelected,
  setContractSelected,
  setIsLoading,
  setCreatedEvents
}) => {

  const { selectedAccount } = useContext(AccountsContext);
  const address = selectedAccount?.address;
  
  const getEvents = useCallback(() => {
    // Get created contracts events to populate the selector
    address && getAndSetClientContractCreatedEvents(setIsLoading, setCreatedEvents, address)
  }, [selectedAccount])

  useEffect(() => {
    getEvents();
  }, [selectedAccount]);

  
  const handleSelectedContract = (event: SelectChangeEvent<number>) => {
    contracts && setContractSelected(event.target.value as number);
  };
  
  const contractsLoaded: boolean = contracts && contracts.length > 0 ? true : false;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <FormControl sx={{ m: 1, minWidth: 400 }}>
        <InputLabel id="contracts-label">{isLoading ? 'Loading...' : 'Contract'}</InputLabel>
        <Select
          labelId="contract-select"
          id="contract-select"
          value={0 || contractSelected}
          onChange={(event) => handleSelectedContract(event)}
          autoWidth={false}
          fullWidth
          label="contracts"
          disabled={isLoading}
          autoFocus
        >
          {isLoading ? (
            <MenuItem disabled value={'0'}>
              <Skeleton animation="wave" />
            </MenuItem>
          ) : (
            contractsLoaded ? (contracts!.map((contract, index) => (
              <MenuItem key={contract.address} value={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                  <span>{contract.name}</span>
                  <span>{truncateString(contract.address, 6, 4)}</span>
                </Box>
              </MenuItem>)
            )) : (
              <MenuItem disabled value={'0'}>
                <span style={{ color: 'gray' }}>No contracts for {selectedAccount?.name} account </span>
              </MenuItem>
            )
          )}
        </Select>
      </FormControl>
      <IconButton sx={{ color: 'gray', '&:hover': { color: 'white' }, visibility: isLoading || contractsLoaded ? 'hidden' : 'visible' }} size='small' onClick={() => getEvents()}>
        <RestartAlt />
      </IconButton>
    </Box>
  );
};

export default SelectContract;