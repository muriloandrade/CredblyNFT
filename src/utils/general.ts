import { StatusError, TransactionId } from "@hashgraph/sdk";
import toast from "react-hot-toast";

// https://johnumarattil.medium.com/truncating-middle-portion-of-a-string-in-javascript-173bfe1f9ae3
export function truncateString(str: string, firstCharCount = str?.length, endCharCount = 0, dotCount = 3) {
  if (str.length <= firstCharCount + endCharCount) {
    return str; // No truncation needed
  }

  const firstPortion = str.slice(0, firstCharCount);
  const endPortion = str.slice(-endCharCount);
  const dots = '.'.repeat(dotCount);

  return `${firstPortion}${dots}${endPortion}`;
}

export function copyToClipboard(textToCopy: string) {
  navigator.clipboard.writeText(textToCopy);
  toast.success("Address copied to clipboard");
}

export function logTransactionLink(transactionName: string, transactionId: TransactionId) {

  // Creates the link to Hashscan
  const baseURL = "https://hashscan.io/testnet/transaction/";
  const transactionLink = `${baseURL}${transactionId.toString()}`;

  // Outputs to log
  console.log(`${transactionName} transaction: `, transactionLink);
}

export function logError(error: any) {
  console.error("Contract call failure", error);
  if (error instanceof StatusError) toast.error(error.toJSON().status);
  toast.error("An error has occured\nCheck console log");
}