
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';

interface AddFieldFormProps {
  onAddField: (field: { name: string; type: string }) => void;
}

const AddFieldForm: React.FC<AddFieldFormProps> = ({ onAddField }) => {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    
    onAddField({
      name: newFieldName,
      type: newFieldType
    });
    
    setNewFieldName('');
    setNewFieldType('text');
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <h3 className="text-sm font-medium">Add New Field</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="new-field-name" className="text-xs">Field Name</Label>
          <Input
            id="new-field-name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="e.g., title, address2"
            className="h-8 text-sm"
          />
        </div>
        
        <div>
          <Label htmlFor="new-field-type" className="text-xs">Field Type</Label>
          <Select
            value={newFieldType}
            onValueChange={setNewFieldType}
          >
            <SelectTrigger id="new-field-type" className="h-8 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phoneNumber">Phone Number</SelectItem>
              <SelectItem value="ssn">SSN</SelectItem>
              <SelectItem value="creditCard">Credit Card</SelectItem>
              <SelectItem value="address">Address</SelectItem>
              <SelectItem value="dob">Date of Birth</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button 
        onClick={handleAddField} 
        size="sm" 
        className="w-full"
        disabled={!newFieldName.trim()}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Field
      </Button>
    </div>
  );
};

export default AddFieldForm;
