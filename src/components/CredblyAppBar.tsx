import { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import CloseIcon from '@mui/icons-material/Close';
import RestartAlt from '@mui/icons-material/RestartAlt';

import { AccountsContext } from '../context/accountsProvider';
import { IconButton, Link, Tooltip } from '@mui/material';
import AccountCard from './AccountCard';

function CredblyAppBar() {

  const { accounts, setAccounts, selectedAccount, setSelectedAccount, generateAccountsFcn } = useContext(AccountsContext);
  const accounts_backup = localStorage.getItem("accounts_backup");

  function removeAccounts() {
    const backupAccounts = localStorage.getItem('accounts');
    localStorage.setItem('accounts_backup', backupAccounts!)
    localStorage.removeItem("accounts");
    setAccounts!([]);
  }

  function restoreAccounts() {
    localStorage.setItem('accounts', accounts_backup!)
    generateAccountsFcn!('', '')
  }

  return (
    <AppBar position="static" sx={{ p: 2, mt: 3, mb: 3, borderRadius: 2 }}>
      <Container maxWidth="xl" sx={{ pl: 2 }} disableGutters>
        <Toolbar disableGutters>
          <Link href="/" underline="none" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src="/images/credbly_logo.png"
              alt="Credbly logo"
              sx={{
                height: 80
              }}
            />
          </Link>

          {accounts?.map((acc) => {
            return (
              <Box sx={{ flexGrow: 0, ml: 1, mr: 1 }} key={`${acc.id}`} >
                <AccountCard
                  icon={acc.icon}
                  name={acc.name}
                  balance={`${acc.balance}`}
                  address={acc.address as string}
                  isActive={selectedAccount?.id == acc.id}
                  onButtonClick={() => setSelectedAccount && setSelectedAccount(acc)}
                />
              </Box>
            )
          })}

          {/* Button to remove/restore accounts */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
              {accounts && accounts.length != 0 ? (
              <Tooltip title={"Remove accounts"} followCursor>
                <IconButton
                  onClick={() => removeAccounts()}
                  sx={{
                    height: 25,
                    width: 25,
                    color: 'gray',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      color: 'rgb(244, 67, 54)',
                      backgroundColor: 'transparent',
                    },

                  }}
                  color="default"
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
              ) : accounts_backup && (
                <Tooltip title={"Restore accounts"} followCursor>
                  <IconButton
                    onClick={() => restoreAccounts()}
                    sx={{
                      height: 25,
                      width: 25,
                      color: 'gray',
                      backgroundColor: 'transparent',
                      '&:hover': {
                        color: 'green',
                        backgroundColor: 'transparent',
                      },
  
                    }}
                    color="default"
                  >
                    <RestartAlt />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default CredblyAppBar;


