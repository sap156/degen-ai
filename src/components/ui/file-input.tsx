
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileInputProps {
  onFileChange: (file: File) => void;
  accept?: string;
  className?: string;
  buttonText?: string;
}

export const FileInput: React.FC<FileInputProps> = ({
  onFileChange,
  accept = '.json,.csv,.xlsx',
  className,
  buttonText = 'Upload File',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      onFileChange(file);
    }
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClick}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {buttonText}
        </Button>
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
        />
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            {fileName}
          </div>
        )}
      </div>
    </div>
  );
};
