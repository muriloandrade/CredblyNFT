import { Button } from '@mui/material';
import { ChangeEvent, useState } from 'react';

type FileUpoloaderProps = {
  setInvoice: Function;
}

export default function FileUploader(props: FileUpoloaderProps) {

  const { setInvoice } = props

  const [file, setFile] = useState<File>();

  function onFileChange(event: ChangeEvent) {

    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    const reader = new FileReader();

    if (target && files && files.length > 0) {

      setFile(files[0]);
      reader.readAsText(files[0]);

      reader.onloadend = function () {
        
        setInvoice(reader.result as string);
      }
    }
  };

  return (
    <Button variant="outlined" component="label" sx={{ width: "30ch", color: "gray" }}>{file ? file.name : "Upload invoice file"}<input type="file" hidden onChange={(e) => onFileChange(e)} /></Button>
  )
}
