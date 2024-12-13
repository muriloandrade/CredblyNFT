import React from "react";
import { Box, Typography, Button, Tooltip, CircularProgress } from "@mui/material";
import Icon from "@mui/material/Icon";
import { copyToClipboard, truncateString } from "../utils/general";

interface AccountCardProps {
  icon: React.ReactNode;
  name: string;
  balance: string;
  address: string;
  isActive: boolean;
  onButtonClick: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
  icon,
  name,
  balance,
  address,
  isActive,
  onButtonClick,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "0.5rem",
        border: "0.125rem solid",
        borderColor: isActive ? "primary.main" : "grey.400",
        maxWidth: "100%",
        height: "auto",
        alignItems: "center"
      }}
    >
      <Button
        onClick={onButtonClick}
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          padding: "0.5rem",
          paddingBottom: "0",
          textTransform: "none",
          justifyContent: "flex-start",
        }}
      >

        <Icon
          sx={{
            fontSize: "2rem",
            color: isActive ? "primary.main" : "text.secondary",
            marginRight: "0.75rem",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </Icon>

        {/* Account Name and Balance */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "left",
            flex: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: isActive ? "primary.main" : "text.secondary",
              fontSize: "1rem",
              textAlign: "center",
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isActive ? "primary.dark" : "text.disabled",
              fontSize: "0.875rem",
              textAlign: "right",
            }}
          >
            {balance ? balance : <CircularProgress size="0.75rem" color="inherit" />}
          </Typography>
        </Box>
      </Button>

      {/* Separator */}
      <Box
        sx={{
          width: "90%",
          height: "1px",
          marginBottom: "0.25rem",
          backgroundColor: "rgba(158, 158, 158, 0.5)",
        }}
      />

      {/* Address */}
      <Tooltip title="click to copy">
        <Button
          onClick={() => copyToClipboard(address)}
          sx={{
            width: "100%",
            textTransform: "none",
            justifyContent: "center",
            padding: "0",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "transparent",
            },

          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              textAlign: "center",
              width: "100%",
              color: "text.secondary",
              "&:hover": {
                color: "text.primary",
              },
            }}
          >
            {truncateString(address, 6, 4)}
          </Typography>
        </Button>
      </Tooltip>
    </Box>
  );
};

export default AccountCard;
