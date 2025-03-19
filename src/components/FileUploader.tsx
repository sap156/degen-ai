
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Check, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  title?: string;
  description?: string;
  downloadUrl?: string;
  downloadFileName?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  accept = '.csv, .json, .xlsx, .parquet',
  maxSize = 10, // 10MB default
  title = 'Upload File',
  description = 'Drag and drop your file here or click to browse',
  downloadUrl,
  downloadFileName,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  const validateAndUploadFile = (file: File) => {
    // Reset error state
    setUploadError(null);
    
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      setUploadError(`File is too large. Maximum size is ${maxSize}MB.`);
      toast.error(`File is too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (fileType && !acceptedTypes.includes(fileType) && acceptedTypes[0] !== '*') {
      setUploadError(`Invalid file type. Accepted formats: ${accept}`);
      toast.error(`Invalid file type. Accepted formats: ${accept}`);
      return;
    }

    setFile(file);
    setIsUploading(true);
    
    // Call the onFileUpload handler and handle potential errors
    try {
      onFileUpload(file);
      
      // Success state after a delay for UI feedback
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(true);
        
        // Reset success state after some time
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      }, 1500);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setIsUploading(false);
      setUploadError('Error processing file. Please try another file or format.');
      toast.error('Error processing file. Please check file format.');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center
            transition-all duration-200 cursor-pointer
            flex flex-col items-center justify-center space-y-3
            min-h-[12rem]
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/30'
            }
          `}
        >
          <motion.div 
            animate={{ y: isDragging ? -5 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Upload 
              className={`mx-auto h-10 w-10 mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} 
            />
          </motion.div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {description}
          </p>
          <p className="text-xs text-muted-foreground">
            Accepted formats: {accept} (Max size: {maxSize}MB)
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-muted/50 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {file.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
                  />
                )}
                {uploadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Check className="h-5 w-5 text-green-500" />
                  </motion.div>
                )}
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="h-8 w-8 rounded-full hover:bg-muted"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {uploadError && (
            <p className="text-xs text-red-500 mt-2 text-center">
              {uploadError}
            </p>
          )}
        </div>
      )}
      
      {downloadUrl && (
        <Button 
          onClick={handleDownload} 
          variant="outline" 
          size="sm" 
          className="mt-3 text-xs flex items-center"
        >
          <Download className="mr-1 h-3 w-3" />
          Download Generated File
        </Button>
      )}
    </div>
  );
};

export default FileUploader;
