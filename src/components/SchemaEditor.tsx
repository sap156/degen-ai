
import React from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchemaFieldType } from '@/utils/fileTypes';

interface SchemaEditorProps {
  schema: Record<string, SchemaFieldType> | null;
  additionalFields: Array<{ name: string; type: 'number' | 'boolean' | 'category' }>;
  setAdditionalFields: (fields: Array<{ name: string; type: 'number' | 'boolean' | 'category' }>) => void;
  excludeDefaultValue: boolean;
  excludeTimestamp?: boolean;
}

const SchemaEditor: React.FC<SchemaEditorProps> = ({
  schema,
  additionalFields,
  setAdditionalFields,
  excludeDefaultValue,
  excludeTimestamp = true
}) => {
  if (!schema) return null;
  
  // Convert schema to array of field objects for editing
  const schemaFields = Object.entries(schema)
    .filter(([key]) => {
      // Exclude timestamp and optionally value fields
      return (!excludeTimestamp || key !== 'timestamp') && 
             (!excludeDefaultValue || key !== 'value');
    })
    .map(([key, type]) => {
      // Map schema type to field type
      let fieldType: 'number' | 'boolean' | 'category' = 'number';
      
      if (type === 'boolean') {
        fieldType = 'boolean';
      } else if (type === 'string' || type === 'address' || type === 'name' || type === 'email') {
        fieldType = 'category';
      } else if (type === 'integer' || type === 'float' || type === 'number') {
        fieldType = 'number';
      }
      
      return { name: key, type: fieldType };
    });

  const handleAddField = () => {
    setAdditionalFields([...additionalFields, { name: `field${additionalFields.length + 1}`, type: 'number' }]);
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = [...additionalFields];
    updatedFields.splice(index, 1);
    setAdditionalFields(updatedFields);
  };

  const handleFieldChange = (index: number, field: { name: string; type: 'number' | 'boolean' | 'category' }) => {
    const updatedFields = [...additionalFields];
    updatedFields[index] = field;
    setAdditionalFields(updatedFields);
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Configure Schema Fields</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddField}
          className="h-8"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>
      
      {additionalFields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No additional fields configured. Add fields to customize your dataset.
        </p>
      )}
      
      {additionalFields.map((field, index) => (
        <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
          <div>
            <Label htmlFor={`field-name-${index}`}>Field Name</Label>
            <Input
              id={`field-name-${index}`}
              value={field.name}
              onChange={(e) => handleFieldChange(index, { ...field, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={`field-type-${index}`}>Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: 'number' | 'boolean' | 'category') => 
                handleFieldChange(index, { ...field, type: value })}
            >
              <SelectTrigger id={`field-type-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-6"
            onClick={() => handleRemoveField(index)}
          >
            <MinusCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SchemaEditor;
