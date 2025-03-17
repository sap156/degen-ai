
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SchemaUploaderProps {
  schema: string;
  setSchema: (schema: string) => void;
}

const SchemaUploader: React.FC<SchemaUploaderProps> = ({ schema, setSchema }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.json') && !file.name.endsWith('.txt')) {
      toast.error('Please upload a SQL, JSON, or TXT file');
      return;
    }

    setFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSchema(content);
      toast.success(`Schema file "${file.name}" loaded successfully`);
    };
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleClearSchema = () => {
    setSchema('');
    setFile(null);
    toast.info('Schema cleared');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Upload Schema</label>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('schema-upload')?.click()} 
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {file ? file.name : 'Upload Schema File'}
          </Button>
          {file && (
            <Button variant="ghost" size="icon" onClick={handleClearSchema}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <input
          id="schema-upload"
          type="file"
          accept=".sql,.json,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Schema Definition</label>
        <Textarea
          placeholder="Paste your database schema here (tables, columns, relationships)"
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          className="h-[200px]"
        />
      </div>
      
      <div className="text-xs text-muted-foreground">
        Providing a database schema will improve SQL generation accuracy.
      </div>
    </div>
  );
};

export default SchemaUploader;
