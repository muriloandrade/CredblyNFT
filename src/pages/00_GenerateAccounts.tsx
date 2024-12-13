import { useContext, useEffect, useState } from 'react'
import { Container, Box, Typography, Button, TextField, CircularProgress } from '@mui/material'
import { AccountsContext } from '../context/accountsProvider';

export default function GenerateAccounts() {

  const [userAccountId, setUserAccountId] = useState('');
  const [userPrivateKey, setPrivateKey] = useState('');
  const { isLoading, generateAccountsFcn } = useContext(AccountsContext);

  const handleGenerateAccounts = async () => {
    generateAccountsFcn!(userAccountId, userPrivateKey);
  };

  // Skip this page if accounts has been already generated
  useEffect(() => {
    'accounts' in localStorage && generateAccountsFcn!('', '');
  })

  return (!('accounts' in localStorage) &&
    <Container maxWidth="xl" disableGutters>

      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 700,
          margin: 'auto',
          padding: 3,
          border: '1px solid #ccc',
          borderRadius: 2,
        }}
        onSubmit={(e) => e.preventDefault()}
      >
        <Typography variant="h6" component="h2" align="center">
          Welcome to Credbly
        </Typography>

        {/* Introduction text */}
        <Typography variant="body2" color="textSecondary" align="center">
          Initially, four Hedera accounts will be created (Brand_A, Brand_B, Retailer and Customer), with a total expenditure of <span style={{ fontWeight: 'bold' }}>280ℏ</span>, to simulate interactions with the network and the smart contracts. 
        </Typography>

        <Typography variant="body2" color="textSecondary" align="center">
          Please provide below your testnet ECDSA account data.
        </Typography>

        <Typography variant="body2" color="textSecondary" align="center">
          Rest assured, your information will not be stored or sent over the internet. It will only be used for generating the accounts with Hedera SDK.
        </Typography>

        <TextField
          label="ECDSA Account ID"
          variant="outlined"
          value={userAccountId}
          onChange={(e) => setUserAccountId(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="DER Encoded Private Key"
          variant="outlined"
          value={userPrivateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          required
          fullWidth
          type="password"
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>

          <Box sx={{ m: 1, position: 'relative' }}>
            <Button
              variant="contained"
              // sx={buttonSx}
              disabled={isLoading}
              onClick={handleGenerateAccounts}
            >
              Generate Accounts
            </Button>
            {isLoading && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  )
}