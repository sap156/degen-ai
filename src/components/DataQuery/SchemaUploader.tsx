
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Check, X, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateSchema } from '@/utils/schemaDetection';
import { parseCSV, parseJSON } from '@/utils/dataParsing';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.json') && 
        !file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      toast.error('Please upload a SQL, JSON, CSV, or TXT file');
      return;
    }

    setFile(file);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // If it's a data file (CSV or JSON), detect schema automatically
      if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        try {
          let data;
          if (file.name.endsWith('.csv')) {
            data = parseCSV(content);
          } else {
            data = parseJSON(content);
          }
          
          // Ensure data is an array
          const dataArray = Array.isArray(data) ? data : 
            (typeof data === 'object' && data !== null ? 
              Object.values(data).find(Array.isArray) || [] : []);
          
          if (dataArray.length === 0) {
            toast.error('No valid data found in the file');
            return;
          }
          
          // Generate schema from data
          const detectedSchema = generateSchema(dataArray);
          
          // Convert to SQL-like schema format
          const schemaStr = Object.entries(detectedSchema)
            .map(([table, fields]) => {
              // Detect table name from filename or use "main_table"
              const tableName = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_') || 'main_table';
              
              return `CREATE TABLE ${tableName} (\n  ${
                Object.entries(fields)
                  .map(([field, type]) => {
                    let sqlType = 'TEXT';
                    if (type === 'integer') sqlType = 'INTEGER';
                    if (type === 'float') sqlType = 'REAL';
                    if (type === 'boolean') sqlType = 'BOOLEAN';
                    if (type === 'date') sqlType = 'DATETIME';
                    
                    return `${field} ${sqlType}`;
                  })
                  .join(',\n  ')
              }\n);`;
            })
            .join('\n\n');
          
          setSchema(schemaStr);
          toast.success(`Schema detected from "${file.name}" data`);
        } catch (error) {
          console.error('Error detecting schema:', error);
          setSchema(content);
          toast.warning('Could not auto-detect schema. File content loaded as-is.');
        }
      } else {
        // Regular schema file
        setSchema(content);
        toast.success(`Schema file "${file.name}" loaded successfully`);
      }
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

  const sampleSchema = `-- Database Schema Example
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  signup_date DATE,
  last_login TIMESTAMP
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_date TIMESTAMP NOT NULL,
  total_amount REAL,
  status TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT,
  in_stock INTEGER
);`;

  const jsonSampleSchema = `[
  {
    "tableName": "customers",
    "columns": [
      {"name": "id", "dataType": "INTEGER", "isPrimaryKey": true},
      {"name": "name", "dataType": "TEXT", "isNotNull": true},
      {"name": "email", "dataType": "TEXT", "isUnique": true},
      {"name": "signup_date", "dataType": "DATE"},
      {"name": "last_login", "dataType": "TIMESTAMP"}
    ]
  },
  {
    "tableName": "orders",
    "columns": [
      {"name": "id", "dataType": "INTEGER", "isPrimaryKey": true},
      {"name": "customer_id", "dataType": "INTEGER", "isNotNull": true},
      {"name": "order_date", "dataType": "TIMESTAMP", "isNotNull": true},
      {"name": "total_amount", "dataType": "REAL"},
      {"name": "status", "dataType": "TEXT"}
    ],
    "foreignKeys": [
      {"column": "customer_id", "references": "customers(id)"}
    ]
  }
]`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Upload Schema</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Schema Upload Options</h4>
                <p className="text-sm text-muted-foreground">
                  Upload one of the following:
                </p>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  <li>SQL schema file (.sql)</li>
                  <li>JSON schema description (.json)</li>
                  <li>CSV or JSON data file to auto-detect schema</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  For data files, we'll analyze the structure and generate a schema automatically.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('schema-upload')?.click()} 
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {file ? file.name : 'Upload Schema or Data File'}
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
          accept=".sql,.json,.txt,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="text-xs text-muted-foreground">
          Supports SQL (.sql), JSON schema (.json), or data files (.csv, .json) for auto-detection
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Schema Definition</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-[400px] overflow-auto">
              <div className="space-y-2">
                <h4 className="font-medium">Sample Schema</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  SQL Format:
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {sampleSchema}
                </pre>
                <p className="text-xs text-muted-foreground mt-4 mb-2">
                  Or JSON Format:
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {jsonSampleSchema}
                </pre>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Textarea
          placeholder="Paste your database schema here (tables, columns, relationships)"
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          className="h-[200px] font-mono text-sm"
        />
      </div>
      
      <div className="text-xs text-muted-foreground">
        Providing a database schema will improve SQL generation accuracy.
      </div>
    </div>
  );
};

export default SchemaUploader;
