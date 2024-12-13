import { Client, ContractCallQuery } from "@hashgraph/sdk";
import { ethers, BigNumber } from "ethers";
import toast from "react-hot-toast";
import { NftType } from "../components/NftCard";
import { logError } from "./general";

// Master and Holder contracts
import master from "../contracts/Credbly_Master";
import holder from "../contracts/Credbly_Holder";
import axios from "axios";
master.id = import.meta.env.VITE_MASTER_ID;
master.address = import.meta.env.VITE_MASTER_ADDR;
holder.id = import.meta.env.VITE_HOLDER_ID;
holder.address = import.meta.env.VITE_HOLDER_ADDR;

const mirrorNodeUrl = 'https://testnet.mirrornode.hedera.com/api/v1/blocks/';

// Events of Client created contracts
export async function getAndSetClientContractCreatedEvents(setIsLoading: Function, setCreatedEvents: Function, address: string) {

  setIsLoading(true);

  try {
    const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
    const masterContract = new ethers.Contract(master.address, master.abi, provider);
    // const masterBlock = (await provider.getTransactionReceipt(master.transactionHash)).blockNumber;
    const fromBlock = (await axios.get(mirrorNodeUrl)).data.blocks[0].number - 300000; //latest block minus 300.000

    const clientContractCreatedFilter = masterContract.filters.ClientContractCreated(ethers.utils.getAddress(address))
    const events = await masterContract.queryFilter(clientContractCreatedFilter, fromBlock);
    setCreatedEvents(events);
  } catch (error) {
    toast.error(`An error has occurred. Check console log.`);
    console.error(`Error retrieving events`, error);
  } finally {
    setIsLoading(false);
  }
}

// Get NFTs from NFTs redeemed events
export async function getAndSetNFTsRedeemedEvents(setIsLoading: Function, setNfts: Function, address: string) {

  setIsLoading(true);

  try {
    const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
    const holderContract = new ethers.Contract(holder.address, holder.abi, provider);
    // const holderBlock = (await provider.getTransactionReceipt(holder.transactionHash)).blockNumber;
    const fromBlock = (await axios.get(mirrorNodeUrl)).data.blocks[0].number - 300000; //latest block minus 300.000

    // Filtra os eventos usando o endereço fornecido
    const nftsRedeemedFilter = holderContract.filters.NftsRedeemed(ethers.utils.getAddress(address));
    const events = await holderContract.queryFilter(nftsRedeemedFilter, fromBlock);

    if (events.length > 0) {
      // Mapeia os eventos para NFTs
      const nfts = events.flatMap((e) => {
        const timestamp = (e.args![2] as BigNumber).toNumber();

        return (e.args![1] as NftType[])
          .filter((nft) => nft.owner.toUpperCase() === address.toUpperCase())
          .map((nft) => ({ ...nft, timestamp }));
      });

      setNfts(nfts);
    } else {
      setNfts([]);
    }
  } catch (error) {
    logError(error);
  } finally {
    setIsLoading(false);
  }
}

// Get a list of Retailer's relationship with Clients contracts
export async function getKnownClients(setIsLoading: Function, setCreatedEvents: Function, client: Client) {

  setIsLoading(true);

  const query = new ContractCallQuery()
    .setContractId(master.id)
    .setGas(100_000)
    .setFunction("getKnownClients");

  const response = await query.execute(client!);

  // Decode the return (address[])
  const encodedResult = response.bytes;
  const abiCoder = new ethers.utils.AbiCoder();
  const addresses = abiCoder.decode(["address[]"], encodedResult)[0];

  
  const provider = new ethers.providers.JsonRpcProvider("https://testnet.hashio.io/api");
  const masterContract = new ethers.Contract(master.address, master.abi, provider);
  // const masterBlock = (await provider.getTransactionReceipt(master.transactionHash)).blockNumber
    const fromBlock = (await axios.get(mirrorNodeUrl)).data.blocks[0].number - 300000; //latest block minus 300.000
  
  // For each known contract, get it's creation event
  try {
    const promises = addresses.map(async (address: any) => {
      const clientContractCreatedFilter = masterContract.filters.ClientContractCreated(null, ethers.utils.getAddress(address));
      const event = clientContractCreatedFilter && await masterContract.queryFilter(clientContractCreatedFilter, fromBlock);
      return event; 
    });
  
    const resolvedEvents = await Promise.all(promises);
    const filteredEvents = resolvedEvents.filter((e) => e && e.length > 0); // Remove empty or undefined
    setCreatedEvents(filteredEvents.flat()); // Unifies the array of arrays
  } catch (error) {
    toast.error(`An error has occurred\nCheck console log`);
    console.log(`Error retrieving events`, error);
  } finally {
    setIsLoading(false);
  }
}