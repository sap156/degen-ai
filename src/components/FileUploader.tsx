import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Check, Download, File, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  title?: string;
  description?: string;
  downloadUrl?: string;
  downloadFileName?: string;
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  accept = '.csv, .json, .xlsx, .parquet',
  maxSize = 10, // 10MB default
  title = 'Upload File',
  description = 'Drag and drop your file here or click to browse',
  downloadUrl,
  downloadFileName,
  error
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff'].includes(ext || '')) {
      return <ImageIcon className="h-6 w-6 text-primary" />;
    } else if (ext === 'pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else if (['txt'].includes(ext || '')) {
      return <FileText className="h-6 w-6 text-gray-500" />;
    } else {
      return <File className="h-6 w-6 text-primary" />;
    }
  };

  const validateAndUploadFile = (file: File) => {
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      toast.error(`File is too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    const fileType = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    const isAcceptableFile = fileType && (
      acceptedTypes.includes(fileType) || 
      acceptedTypes.includes('*') ||
      (acceptedTypes.includes('pdf') && fileType === 'pdf') ||
      (acceptedTypes.includes('image') && file.type.startsWith('image/'))
    );
    
    if (!isAcceptableFile) {
      toast.error(`Invalid file type. Accepted formats: ${accept}`);
      return;
    }

    setFile(file);
    setIsUploading(true);
    
    setTimeout(() => {
      onFileUpload(file);
      setIsUploading(false);
      setUploadSuccess(true);
      
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    }, 800);
  };

  const handleRemoveFile = () => {
    setFile(null);
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
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
                {getFileIcon(file)}
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
