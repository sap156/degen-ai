
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SchemaFieldType } from '@/utils/fileUploadUtils';

interface ExtractedContentSectionProps {
  extractedText: string;
  data: any[];
  schema: Record<string, SchemaFieldType>;
}

const ExtractedContentSection: React.FC<ExtractedContentSectionProps> = ({ 
  extractedText, 
  data, 
  schema 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-medium">Extracted Content</Label>
        <Textarea 
          value={extractedText.slice(0, 5000) + (extractedText.length > 5000 ? '...' : '')} 
          readOnly 
          className="min-h-[300px] mt-2 font-mono text-xs" 
        />
        <p className="text-xs text-muted-foreground mt-1">
          {extractedText.length > 5000 && 
            `Showing first 5,000 characters of ${extractedText.length.toLocaleString()} total`
          }
        </p>
      </div>
      
      {data.length > 0 && (
        <>
          <div>
            <Label className="text-lg font-medium">Detected Schema</Label>
            <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[200px] mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(schema).map(([field, type]) => (
                    <TableRow key={field}>
                      <TableCell className="font-medium">{field}</TableCell>
                      <TableCell>{type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <Label className="text-lg font-medium">
              Data Preview 
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({data.length.toLocaleString()} records total)
              </span>
            </Label>
            <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[300px] mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.length > 0 && Object.keys(data[0]).map(key => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((value: any, valueIndex) => (
                        <TableCell key={valueIndex}>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.length > 5 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Showing 5 of {data.length.toLocaleString()} rows
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExtractedContentSection;
