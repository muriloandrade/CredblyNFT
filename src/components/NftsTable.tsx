import { Grid } from '@mui/material';
import NftCard, { NftType } from './NftCard';

interface NftsTableProps {
  nfts: NftType[] | undefined;
}

export default function NftsTable(props: NftsTableProps) {

  const { nfts } = props;

  return (
    <Grid container spacing={2}>
      {nfts?.map( nft => (<NftCard nft={nft} key={`${nft.addr}_${nft.serialNumber}`} />))}
    </Grid>
  );
}