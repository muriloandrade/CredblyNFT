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