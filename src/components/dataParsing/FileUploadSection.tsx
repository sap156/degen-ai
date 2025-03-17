
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUploader from '@/components/FileUploader';

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void;
  fileContent: string;
  isLoading: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileUpload,
  fileContent,
  isLoading
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Upload Data File</Label>
        <FileUploader 
          onFileUpload={onFileUpload} 
          accept=".csv,.json,.txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" 
          maxSize={10} 
          title="Upload Data File" 
          description="Drag and drop your data file here or click to browse" 
        />
      </div>
      
      {fileContent && (
        <div>
          <Label className="mb-2 block">File Preview</Label>
          <Textarea 
            value={fileContent.slice(0, 2000) + (fileContent.length > 2000 ? '...' : '')} 
            readOnly 
            className="min-h-[200px] font-mono text-xs" 
          />
          {fileContent.length > 2000 && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing first 2,000 characters of {fileContent.length.toLocaleString()} total
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;
