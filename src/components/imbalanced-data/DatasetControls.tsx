
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { File, Upload, X } from 'lucide-react';
import { formatFileSize } from '@/utils/fileOperations';

interface DatasetControlsProps {
  onFileUpload: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
}

const DatasetControls: React.FC<DatasetControlsProps> = ({
  onFileUpload,
  selectedFile,
  onClearFile
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Upload your dataset to begin
        </p>

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drag and drop your file</p>
              <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.json,.xlsx"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Browse Files
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium">File: {selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                Size: {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetControls;
