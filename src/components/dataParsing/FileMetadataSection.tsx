
import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/utils/fileOperations';

interface FileMetadataSectionProps {
  fileMetadata: Record<string, any>;
}

const FileMetadataSection: React.FC<FileMetadataSectionProps> = ({ fileMetadata }) => {
  if (!fileMetadata || Object.keys(fileMetadata).length === 0) {
    return null;
  }

  // Format specific metadata values for better display
  const formattedMetadata = { ...fileMetadata };
  
  // Format file size if present
  if (formattedMetadata.size) {
    formattedMetadata.size = formatFileSize(formattedMetadata.size);
  }
  
  // Format date if present
  if (formattedMetadata.lastModified) {
    const date = new Date(formattedMetadata.lastModified);
    formattedMetadata.lastModified = date.toLocaleString();
  }

  return (
    <div>
      <Label className="text-lg font-medium">File Information</Label>
      <div className="bg-muted/30 p-4 rounded-md mt-2">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(formattedMetadata).map(([key, value]) => (
            <div key={key} className="py-1">
              <span className="font-medium">{key}: </span>
              <span className="text-muted-foreground">
                {typeof value === 'boolean' 
                  ? (value ? 'Yes' : 'No')
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
        
        {fileMetadata.type && (
          <div className="mt-3">
            <Badge variant="outline" className="text-xs">
              {fileMetadata.type}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileMetadataSection;
