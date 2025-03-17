
import React from 'react';
import { Label } from '@/components/ui/label';

interface FileMetadataSectionProps {
  fileMetadata: Record<string, any>;
}

const FileMetadataSection: React.FC<FileMetadataSectionProps> = ({ fileMetadata }) => {
  return (
    <div>
      <Label className="text-lg font-medium">File Information</Label>
      <div className="bg-muted/30 p-4 rounded-md mt-2">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(fileMetadata).map(([key, value]) => (
            <div key={key} className="py-1">
              <span className="font-medium">{key}: </span>
              <span className="text-muted-foreground">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileMetadataSection;
