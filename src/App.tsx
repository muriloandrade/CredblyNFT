import { Container } from '@mui/material';
import CredblyAppBar from "./components/CredblyAppBar";
import BasicTabs from "./components/BasicTabs";
import "./styles/Home.css";
import AccountsProvider from './context/accountsProvider';

export default function Home() {

  return (
    <Container fixed >

      <AccountsProvider>

        <CredblyAppBar />

        <BasicTabs />

      </AccountsProvider>

    </Container>
  );
}
