import { useEffect, useState } from 'react';
import NftCard, { NftType } from './NftCard';
import { Grid2 } from '@mui/material';

interface NftsTableProps {
  nfts: NftType[] | undefined;
}

export default function NftsTable(props: NftsTableProps) {

  const { nfts } = props;

  return (
    <Grid2 container spacing={2}>
      {nfts?.map( nft => (<NftCard nft={nft} key={`${nft.addr}_${nft.serialNumber}`} />))}
    </Grid2>
  );
}