import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from '@mui/material';
import { Toaster } from "react-hot-toast";

import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8c9eff',
    },
    secondary: {
      main: '#c15f41',
    },
  },
});

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        reverseOrder={true}
        toastOptions={{ duration: 3000 }}
      />
        <App />
    </ThemeProvider>
  </React.StrictMode>
);
