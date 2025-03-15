
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  FileUp,
  Tag,
  Search,
  Database,
  Download,
  Copy,
  Trash2
} from 'lucide-react';
import FileUploader from '@/components/FileUploader';

// Entity types that can be recognized
const entityTypes = [
  { id: 'person', label: 'Person', color: 'bg-blue-100 border-blue-400 text-blue-800' },
  { id: 'organization', label: 'Organization', color: 'bg-green-100 border-green-400 text-green-800' },
  { id: 'location', label: 'Location', color: 'bg-amber-100 border-amber-400 text-amber-800' },
  { id: 'date', label: 'Date', color: 'bg-purple-100 border-purple-400 text-purple-800' },
  { id: 'money', label: 'Money', color: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { id: 'percentage', label: 'Percentage', color: 'bg-rose-100 border-rose-400 text-rose-800' },
  { id: 'email', label: 'Email', color: 'bg-sky-100 border-sky-400 text-sky-800' },
  { id: 'phone', label: 'Phone', color: 'bg-indigo-100 border-indigo-400 text-indigo-800' },
  { id: 'url', label: 'URL', color: 'bg-orange-100 border-orange-400 text-orange-800' },
];

interface Entity {
  id: string;
  type: string;
  text: string;
  startPos: number;
  endPos: number;
}

const EntityRecognition: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>(
    entityTypes.map(type => type.id)
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('text');

  // Toggle entity type selection
  const toggleEntityType = (typeId: string) => {
    setSelectedEntityTypes(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      
      // Read the file content
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target?.result) {
          const content = e.target.result as string;
          setFileContent(content);
          setText(content);
          setIsProcessing(false);
        }
      };
      fileReader.onerror = () => {
        toast.error('Error reading file');
        setIsProcessing(false);
      };
      fileReader.readAsText(file);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
      setIsProcessing(false);
    }
  };

  // Process text to identify entities
  const processText = () => {
    if (!text.trim()) {
      toast.error('Please enter or upload text first');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // This is a mock implementation; in a real app, you would call an NER API
      setTimeout(() => {
        // Mock entities based on some simple patterns
        const mockEntities: Entity[] = [];
        let entityId = 1;
        
        // Only process selected entity types
        if (selectedEntityTypes.includes('person')) {
          // Simple pattern for names (2 capital words together)
          const nameRegex = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
          let match;
          while ((match = nameRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'person',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        if (selectedEntityTypes.includes('organization')) {
          // Simple pattern for organizations (words ending in Inc, Corp, LLC)
          const orgRegex = /([A-Za-z]+ (Inc|Corp|LLC|Company|Technologies|Systems))/g;
          let match;
          while ((match = orgRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'organization',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        if (selectedEntityTypes.includes('location')) {
          // Simple pattern for locations
          const locationPatterns = [
            /([A-Z][a-z]+ (City|Street|Road|Avenue|Blvd|Park))/g,
            /(New York|Los Angeles|Chicago|San Francisco|London|Paris|Tokyo)/g
          ];
          
          locationPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
              mockEntities.push({
                id: `entity-${entityId++}`,
                type: 'location',
                text: match[0],
                startPos: match.index,
                endPos: match.index + match[0].length
              });
            }
          });
        }
        
        if (selectedEntityTypes.includes('date')) {
          // Simple patterns for dates
          const datePatterns = [
            /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g, // MM/DD/YYYY
            /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/g, // YYYY/MM/DD
            /\b(January|February|March|April|May|June|July|August|September|October|November|December) (0?[1-9]|[12]\d|3[01])(st|nd|rd|th)?, (19|20)\d{2}\b/g // Month DD, YYYY
          ];
          
          datePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
              mockEntities.push({
                id: `entity-${entityId++}`,
                type: 'date',
                text: match[0],
                startPos: match.index,
                endPos: match.index + match[0].length
              });
            }
          });
        }
        
        if (selectedEntityTypes.includes('money')) {
          // Pattern for money
          const moneyRegex = /(\$\d+(,\d{3})*(\.\d{2})?)/g;
          let match;
          while ((match = moneyRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'money',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        if (selectedEntityTypes.includes('percentage')) {
          // Pattern for percentages
          const percentageRegex = /(\d+(\.\d+)?%)/g;
          let match;
          while ((match = percentageRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'percentage',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        if (selectedEntityTypes.includes('email')) {
          // Pattern for emails
          const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
          let match;
          while ((match = emailRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'email',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        if (selectedEntityTypes.includes('phone')) {
          // Pattern for phone numbers
          const phoneRegex = /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
          let match;
          while ((match = phoneRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'phone',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        if (selectedEntityTypes.includes('url')) {
          // Pattern for URLs
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          let match;
          while ((match = urlRegex.exec(text)) !== null) {
            mockEntities.push({
              id: `entity-${entityId++}`,
              type: 'url',
              text: match[0],
              startPos: match.index,
              endPos: match.index + match[0].length
            });
          }
        }
        
        setEntities(mockEntities);
        
        if (mockEntities.length > 0) {
          toast.success(`Found ${mockEntities.length} entities in the text`);
        } else {
          toast.info('No entities found in the text');
        }
        
        setIsProcessing(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing text:', error);
      toast.error('Failed to process text');
      setIsProcessing(false);
    }
  };

  // Generate highlighted text with entity tags
  const renderHighlightedText = () => {
    if (!text || !entities.length) return text;
    
    // Sort entities by start position (earlier first)
    const sortedEntities = [...entities].sort((a, b) => a.startPos - b.startPos);
    
    let result = [];
    let lastIndex = 0;
    
    for (const entity of sortedEntities) {
      // Add text before the entity
      if (entity.startPos > lastIndex) {
        result.push(text.substring(lastIndex, entity.startPos));
      }
      
      // Get entity type details
      const entityType = entityTypes.find(type => type.id === entity.type);
      const colorClass = entityType?.color || 'bg-gray-100 border-gray-400 text-gray-800';
      
      // Add the highlighted entity
      result.push(
        <span
          key={entity.id}
          className={`px-1 py-0.5 rounded border ${colorClass} inline-flex items-center`}
        >
          {entity.text}
          <span className="text-xs ml-1 px-1 bg-white/30 rounded">
            {entityType?.label || entity.type}
          </span>
        </span>
      );
      
      // Update last index
      lastIndex = entity.endPos;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    
    return result;
  };

  // Export entities to JSON
  const exportEntities = () => {
    if (!entities.length) {
      toast.error('No entities to export');
      return;
    }
    
    try {
      // Format entities for export
      const exportData = {
        text,
        entities: entities.map(entity => ({
          type: entity.type,
          text: entity.text,
          startPos: entity.startPos,
          endPos: entity.endPos
        }))
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName ? `entities-${fileName}.json` : 'extracted-entities.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Entities exported successfully');
    } catch (error) {
      console.error('Error exporting entities:', error);
      toast.error('Failed to export entities');
    }
  };

  // Clear all data
  const clearAll = () => {
    setText('');
    setEntities([]);
    setFileContent('');
    setFileName('');
  };

  // Get entity counts by type
  const getEntityCounts = () => {
    const counts: Record<string, number> = {};
    
    entities.forEach(entity => {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    });
    
    return counts;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-2 mb-8">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Entity Recognition
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Extract and identify named entities from text documents
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Text</CardTitle>
              <CardDescription>
                Enter or upload text to analyze for entities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="text">
                    <span className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Enter Text
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <span className="flex items-center">
                      <FileUp className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Enter text to analyze for entities..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[300px]"
                  />
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-4">
                  <FileUploader
                    onFileUpload={handleFileUpload}
                    accept=".txt,.md,.csv,.json,.html"
                    maxSize={5}
                    title="Upload Text File"
                    description="Upload a text file to analyze for entities"
                  />
                  
                  {fileContent && (
                    <div>
                      <Label className="mb-2 block">File Preview</Label>
                      <Textarea
                        value={fileContent.slice(0, 1000) + (fileContent.length > 1000 ? '...' : '')}
                        readOnly
                        className="min-h-[200px] font-mono text-xs"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between flex-wrap gap-2">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={clearAll}
                  disabled={!text}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
              
              <Button
                onClick={processText}
                disabled={!text || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Entities
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Recognized Entities</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportEntities}
                    disabled={!entities.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Text with highlighted entity tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entities.length > 0 ? (
                <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[500px] text-sm whitespace-pre-wrap leading-relaxed">
                  {renderHighlightedText()}
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-md min-h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <Database className="h-12 w-12 mb-2" />
                  <p className="text-center">
                    {text ? 'Process the text to see recognized entities' : 'Enter or upload text first'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Types</CardTitle>
              <CardDescription>
                Select entity types to recognize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entityTypes.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`entity-type-${type.id}`}
                      checked={selectedEntityTypes.includes(type.id)}
                      onCheckedChange={() => toggleEntityType(type.id)}
                    />
                    <Label
                      htmlFor={`entity-type-${type.id}`}
                      className="flex items-center cursor-pointer"
                    >
                      <span className={`w-3 h-3 rounded-full mr-2 ${type.color.split(' ')[0]}`} />
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entity Summary</CardTitle>
              <CardDescription>
                Count of entities by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entities.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(getEntityCounts()).map(([type, count]) => {
                    const entityType = entityTypes.find(t => t.id === type);
                    const colorClass = entityType?.color || 'bg-gray-100 border-gray-400 text-gray-800';
                    
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>
                            {entityType?.label || type}
                          </span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                  
                  <div className="border-t pt-3 mt-3 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">{entities.length}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No entities recognized yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EntityRecognition;

