import * as React from 'react';
import { useContext } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import {ArrowForwardIos, ArrowBackIosNew} from '@mui/icons-material';

import Step1_Create from '../pages/Manufacturer_Steps/Step1_Create';
import Step2_Mint from '../pages/Manufacturer_Steps/Step2_Mint';
import Step3_Transfer from '../pages/Manufacturer_Steps/Step3_Transfer';
import { IconButton, Stack } from '@mui/material';
import { AccountsContext } from '../context/accountsProvider';

const steps = [
  'Create new contract', 
  'Mint tokens', 
  'Transfer to retailer'
];

export default function MasterStepper() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const { accounts, setSelectedAccount } = useContext(AccountsContext);

  React.useEffect(() => {
    setSelectedAccount!(accounts![0])
  }, [activeStep])

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps} sx={{color: "red"}}>
              <StepLabel {...labelProps} style={{ cursor: "pointer" }} onClick={() => setActiveStep(index)}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Stack direction="row" width="100%" mt={6} mb={6} spacing={4}
        alignItems="stretch"
        // divider={<Divider orientation="vertical" flexItem />}
        justifyContent="space-between"
      >

        <Stack alignItems="center" justifyContent="center" >
          <IconButton color="inherit" onClick={handleBack} sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }} ><ArrowBackIosNew /></IconButton>
        </Stack>

        <Box
          component="form"
          sx={{ mt: 6, ml: 5, mr: 5, mb: 3, display: "flex", width: "100%" }}
          noValidate
          autoComplete="off"
        >
          {activeStep == 0 && <Step1_Create />}
          {activeStep == 1 && <Step2_Mint />}
          {activeStep == 2 && <Step3_Transfer />}

        </Box>

        <Stack alignItems="center" justifyContent="center" >
          <IconButton onClick={handleNext} sx={{ visibility: activeStep === steps.length - 1 ? 'hidden' : 'visible' }} ><ArrowForwardIos /></IconButton>
        </Stack>

      </Stack>

    </Box>
  );
}