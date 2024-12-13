import { Box, Card, CardContent, CardMedia, Grid, Typography, Link } from "@mui/material";
import { useEffect, useState } from "react";

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  type: string;
  files: NftMetadataFile[];
}

interface NftMetadataFile {
  uri: string;
  is_default_file: boolean;
  type: string;
}

export type NftType = {
  seller: string;
  owner: string;
  addr: string;
  serialNumber: number;
  uri: string;
  sku: string;
  timestamp: number;
}

interface NftRowProps {
  nft: NftType;
}

// Formats date/time of minting
function formatTimestamp(timestamp: number) {

  const date = new Date(timestamp * 1000);
  const userLocale = navigator.language || 'en-US';

  return new Intl.DateTimeFormat(userLocale, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

// Leading zeros for NFT serial number
function leadingZeros(num: string, size: number) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

export default function NftCard(props: NftRowProps) {

  const { nft } = props;
  const [metadata, setMetadata] = useState<NftMetadata>();

  // Retreive NFT from client's URL
  useEffect(() => {
    getJSON(nft.uri,
      function (err: any, data: any) {
        if (err !== null) {
          console.log('Something went wrong trying to get NFT metadata: ' + err);
        } else {
          setMetadata(data);
        }
      });

  }, [nft]);

  var getJSON = function (url: string, callback: any) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
  };

  return (
    <Grid
      item xs={12} sm={6} md={4} lg={3}
      key={`${nft.addr}_${nft.serialNumber}`}
      sx={{ height: 434 }}
    >
      {/* NFT body */}
      <Card
        sx={{
          position: "relative",
          height: '100%'
        }}
      >
        <Box
          sx={{
            position: "relative"
          }}
        >
          {/* Image */}
          <Link href={metadata?.image} target="_blank">
          <CardMedia
            component="img"
            sx={{
              objectFit: "cover",
              height: 150
            }}
            image={metadata?.image}
            alt={metadata?.name}
          />
          </Link>
        </Box>
        <CardContent
          sx={{ pb: `8px !important`, pt: `8px !important` }}
        >

          <Box
            sx={{
              height: 250,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                pb: 1
              }}
            >
              {/* Product's SKU */}
              <Link href={nft.uri} target="_blank">
                <Typography variant="overline" color="grey" lineHeight="normal">
                  {nft.sku}
                </Typography>
              </Link>

              {/* space */}
              <Box sx={{ flexGrow: 1 }} />

              {/* NFT Serial Number */}
              <Link href={`https://hashscan.io/testnet/token/${nft.addr}/${nft.serialNumber}`} target="_blank">
                <Typography variant="overline" color="grey" lineHeight="normal">
                  {`#${leadingZeros(nft.serialNumber.toString(), 5)}`}
                </Typography>
              </Link>
            </Box>

            {/* Title */}
            <Typography variant="h6" marginBottom={2}>{metadata?.name}</Typography>

            {/* Scrollbar for description */}
            <Box
              sx={{
                flexGrow: 1,
                position: "relative",
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '10px',
                  transition: 'background-color 0.2s ease-in-out',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              {/* Description */}
              <Typography
                variant="body2"
              >
                {metadata?.description}
              </Typography>
            </Box>

            {/* Creation date/time */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                pt: 1
              }}
            >
              <Typography variant="overline" color={'grey'} lineHeight={'normal'}>
                {formatTimestamp(nft.timestamp)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid >
  )
}