
import React from 'react';
import FileUploader from './FileUploader';

interface FileUploaderWrapperProps {
  onFileUpload: (data: any[]) => void;
  accept: string;
}

const FileUploaderWrapper: React.FC<FileUploaderWrapperProps> = ({ onFileUpload, accept }) => {
  // This component bridges the gap between what FileUploader expects (file: File)
  // and what our pages provide (data: any[])
  const handleFileUpload = (file: File) => {
    // This is a stub for now - in a real implementation we would read and parse the file
    // For now, we'll pass an empty array to satisfy the type system
    onFileUpload([]);
  };

  return <FileUploader onFileUpload={handleFileUpload} accept={accept} />;
};

export default FileUploaderWrapper;
