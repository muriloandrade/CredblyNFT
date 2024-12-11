import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import * as React from 'react';

import FinalConsumer from '../pages/03_FinalConsumer';
import Manufacturer from '../pages/01_Manufacturer';
import Retailer from '../pages/02_Retailer';
import { AccountsContext } from '../context/accountsProvider';
import { Fragment, useContext } from 'react';
import GenerateAccounts from '../pages/00_GenerateAccounts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, pt: 8 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
  const [value, setValue] = React.useState(0);

  const { accounts, setSelectedAccount } = useContext(AccountsContext);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    if (accounts && setSelectedAccount) {
      switch (newValue) {
        case 0:
          setSelectedAccount(accounts[0]);
          break;
        case 1:
          setSelectedAccount(accounts[2]);
          break;
        case 2:
          setSelectedAccount(accounts[3]);
          break;
        default:
          break;
      }
    }
    setValue(newValue);
  };

  return (
    <Fragment>
      {
        accounts && accounts.length != 0 ?
          (<Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="Manufacturer" {...a11yProps(0)} />
                <Tab label="Retailer" {...a11yProps(1)} />
                <Tab label="Final Consumer" {...a11yProps(2)} />
              </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
              <Manufacturer />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <Retailer />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
              <FinalConsumer />
            </CustomTabPanel>
          </Box>) : (<GenerateAccounts />)
      }
    </Fragment>

  );
}