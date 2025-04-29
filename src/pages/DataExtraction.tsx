
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FileUploader from '@/components/FileUploader';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { 
  Download,
  Globe,
  File,
  FileText,
  Image,
  Table,
  Brackets,
  Copy,
  Search,
  List,
  KeyRound,
  FileImage
} from 'lucide-react';
import { 
  extractDataFromUrl, 
  extractDataFromImage,
  extractDataFromDocument,
  processExtractedData, 
  ExtractedData, 
  ExtractionType 
} from '@/services/dataExtractionService';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import UserGuideDataExtraction from '@/components/ui/UserGuideDataExtraction';
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import { Separator } from '@/components/ui/separator';

const DataExtraction: React.FC = () => {
  const { apiKey, isKeySet } = useApiKey();
  const { user } = useAuth();
  const [url, setUrl] = useState<string>('');
  const [extractionType, setExtractionType] = useState<ExtractionType>('tables');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [extractedTextContent, setExtractedTextContent] = useState<string>('');
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [files, setFiles] = useState<{ file: File, preview: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('web');
  const [question, setQuestion] = useState<string>('');
  const [fileQuestion, setFileQuestion] = useState<string>('');
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [isProcessingFollowUp, setIsProcessingFollowUp] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<'text' | 'images' | 'all'>('all');
  const [contentProcessed, setContentProcessed] = useState<boolean>(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-2 mb-8">
          <motion.h1 
            className="text-3xl font-bold tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Data Extraction
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Extract structured data from websites, documents, and images using AI
          </motion.p>
        </div>
        
        <AuthRequirement showUserGuide={<UserGuideDataExtraction />} />
      </div>
    );
  }

  if (!isKeySet) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-2 mb-8">
          <motion.h1 
            className="text-3xl font-bold tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Data Extraction
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Extract structured data from websites, documents, and images using AI
          </motion.p>
        </div>
        
        <ApiKeyRequirement>
          <UserGuideDataExtraction />
        </ApiKeyRequirement>
      </div>
    );
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      setIsLoading(true);
      setContentProcessed(false);
      setExtractedImages([]);
      setExtractedTextContent('');
      
      const result = await extractDataFromUrl(
        apiKey, 
        url, 
        extractionType, 
        question.trim() || undefined
      );
      
      setExtractedData(result);
      
      if (result.structured) {
        // Extract text content
        let textContent = '';
        if (extractionType === 'text' || extractionType === 'json') {
          if (typeof result.structured === 'string') {
            textContent = result.structured;
          } else if (result.structured.text_content) {
            textContent = result.structured.text_content;
          } else if (result.structured.extracted_data) {
            textContent = JSON.stringify(result.structured.extracted_data, null, 2);
          }
        }
        
        // Extract images
        const images: string[] = [];
        if (result.structured.images) {
          images.push(...result.structured.images);
        }
        
        setExtractedTextContent(textContent);
        setExtractedImages(images);
        setContentProcessed(true);
      }
      
      toast.success('Data extracted successfully');
    } catch (error) {
      console.error('Error extracting data:', error);
      toast.error('Failed to extract data from URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const preview = URL.createObjectURL(file);
    setFiles(prev => [...prev, { file, preview }]);
    toast.success(`File uploaded: ${file.name}`);
  };

  const handleExtractFromFiles = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }
    
    try {
      setIsLoading(true);
      setContentProcessed(false);
      setExtractedImages([]);
      setExtractedTextContent('');
      
      let result;
      const file = files[0].file;
      const fileType = file.type.split('/')[0];
      
      if (fileType === 'image') {
        result = await extractDataFromImage(
          apiKey,
          file,
          extractionType === 'tables' ? 'key-value' : extractionType,
          fileQuestion.trim() || undefined
        );
      } else {
        // Handle PDF, DOC, PPT, etc.
        result = await extractDataFromDocument(
          apiKey,
          file,
          extractionType,
          fileQuestion.trim() || undefined
        );
      }
      
      setExtractedData(result);
      
      if (result.structured) {
        // Extract text content
        let textContent = '';
        if (typeof result.structured === 'string') {
          textContent = result.structured;
        } else if (result.structured.text_content) {
          textContent = result.structured.text_content;
        } else if (result.structured.extracted_data) {
          textContent = JSON.stringify(result.structured.extracted_data, null, 2);
        }
        
        // Extract images
        const images: string[] = [];
        if (result.structured.images) {
          images.push(...result.structured.images);
        }
        
        setExtractedTextContent(textContent);
        setExtractedImages(images);
        setContentProcessed(true);
      }
      
      toast.success('Analysis completed successfully');
    } catch (error) {
      console.error('Error extracting from files:', error);
      toast.error('Failed to extract information from files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = async () => {
    if (!extractedData || !followUpQuestion.trim() || !contentProcessed) {
      toast.error(contentProcessed 
        ? 'Please enter a follow-up question' 
        : 'Please extract data first before asking follow-up questions');
      return;
    }
    
    try {
      setIsProcessingFollowUp(true);
      
      const result = await processExtractedData(
        apiKey,
        extractedData.raw,
        followUpQuestion
      );
      
      setExtractedData(result);
      
      if (result.structured && result.structured.answer) {
        setExtractedTextContent(result.structured.answer);
      }
      
      toast.success('Follow-up analysis completed');
    } catch (error) {
      console.error('Error processing follow-up question:', error);
      toast.error('Failed to process follow-up question');
    } finally {
      setIsProcessingFollowUp(false);
    }
  };

  const handleDownload = () => {
    if (!extractedData) {
      toast.error('No data to download');
      return;
    }
    
    try {
      let filename = '';
      let mimeType = '';
      let content = '';
      
      if (showResults === 'text') {
        content = extractedTextContent;
        filename = 'extracted_text.txt';
        mimeType = 'text/plain';
      } else {
        content = extractedData.raw;
        
        switch (extractedData.format) {
          case 'json':
            filename = 'extracted_data.json';
            mimeType = 'application/json';
            break;
          case 'html':
            filename = 'extracted_data.html';
            mimeType = 'text/html';
            break;
          case 'text':
          default:
            filename = 'extracted_data.txt';
            mimeType = 'text/plain';
        }
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success(`Downloaded as ${filename}`);
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data');
    }
  };

  const handleCopyToClipboard = () => {
    if (!extractedData) {
      toast.error('No data to copy');
      return;
    }
    
    const contentToCopy = showResults === 'text' ? extractedTextContent : extractedData.raw;
    
    navigator.clipboard.writeText(contentToCopy)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const clearFiles = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    setFiles([]);
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `extracted_image_${index}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Image downloaded');
  };

  const renderExtractionTypeOptions = () => {
    const options = activeTab === 'web' 
      ? [
          { value: 'tables', label: 'Tables', icon: <Table className="h-4 w-4 mr-2" /> },
          { value: 'lists', label: 'Lists', icon: <List className="h-4 w-4 mr-2" /> },
          { value: 'text', label: 'Main Text Content', icon: <FileText className="h-4 w-4 mr-2" /> },
          { value: 'json', label: 'Full Page (JSON)', icon: <Brackets className="h-4 w-4 mr-2" /> }
        ]
      : [
          { value: 'key-value', label: 'Key-Value Pairs', icon: <KeyRound className="h-4 w-4 mr-2" /> },
          { value: 'text', label: 'Full Text', icon: <FileText className="h-4 w-4 mr-2" /> },
          { value: 'json', label: 'Structured Content', icon: <Brackets className="h-4 w-4 mr-2" /> }
        ];

    return (
      <div>
        <Label htmlFor="extractionType">Extraction Type</Label>
        <select
          id="extractionType"
          value={extractionType}
          onChange={(e) => setExtractionType(e.target.value as ExtractionType)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-2 mb-8">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Data Extraction
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Extract structured data from websites, documents, and images using AI
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Source</CardTitle>
              <CardDescription>
                Select your data source for extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="web">
                    <Globe className="h-4 w-4 mr-2" />
                    Web
                  </TabsTrigger>
                  <TabsTrigger value="images">
                    <Image className="h-4 w-4 mr-2" />
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <File className="h-4 w-4 mr-2" />
                    Others
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="web" className="space-y-4">
                  <form onSubmit={handleUrlSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="url">Website URL</Label>
                        <div className="flex mt-1.5">
                          <Input
                            id="url"
                            type="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="rounded-r-none"
                          />
                          <Button
                            type="submit"
                            disabled={isLoading || !url}
                            className="rounded-l-none"
                          >
                            {isLoading ? (
                              <>
                                <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                                Extracting...
                              </>
                            ) : (
                              <>Extract</>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="question">Ask a specific question (optional)</Label>
                        <Textarea
                          id="question"
                          placeholder="E.g., What are the product prices? What features are mentioned?"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      
                      {renderExtractionTypeOptions()}
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Upload Images</Label>
                    <FileUploader
                      onFileUpload={handleFileUpload}
                      accept=".jpg,.jpeg,.png,.webp,.tiff"
                      maxSize={10}
                      title="Upload Images"
                      description="Upload images to extract text using OCR"
                    />
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="fileQuestion">Ask a specific question (optional)</Label>
                        <Textarea
                          id="fileQuestion"
                          placeholder="E.g., Extract text from this image. What objects are in this image?"
                          value={fileQuestion}
                          onChange={(e) => setFileQuestion(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      
                      {renderExtractionTypeOptions()}
                      
                      <div className="grid grid-cols-2 gap-2">
                        {files.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={file.preview}
                              alt={`Uploaded ${index}`}
                              className="object-cover w-full h-32 rounded-md border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <span className="text-white text-xs">
                                {file.file.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleExtractFromFiles}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Analyze Images
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={clearFiles}
                          disabled={isLoading}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Upload Documents</Label>
                    <FileUploader
                      onFileUpload={handleFileUpload}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      maxSize={15}
                      title="Upload Documents"
                      description="Upload PDFs, Word docs, or other document types"
                    />
                  </div>
                  
                  {files.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="fileQuestion">Ask a specific question (optional)</Label>
                        <Textarea
                          id="fileQuestion"
                          placeholder="E.g., Extract key information. Summarize this document."
                          value={fileQuestion}
                          onChange={(e) => setFileQuestion(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      
                      {renderExtractionTypeOptions()}
                      
                      <div className="grid grid-cols-2 gap-2">
                        {files.map((file, index) => (
                          <div key={index} className="relative group border rounded-md p-2 bg-muted/30">
                            <FileText className="h-8 w-8 mx-auto mb-1" />
                            <div className="text-center text-xs truncate">
                              {file.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleExtractFromFiles}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Analyze Documents
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={clearFiles}
                          disabled={isLoading}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {extractedData && contentProcessed && (
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Analysis</CardTitle>
                <CardDescription>
                  Ask a specific question about the extracted data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="E.g., What's the most expensive item? Summarize the key points."
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                  />
                  <Button 
                    onClick={handleFollowUpQuestion}
                    disabled={isProcessingFollowUp || !followUpQuestion.trim()}
                    className="w-full"
                  >
                    {isProcessingFollowUp ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Analyze"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Extracted Data</span>
                {extractedData && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyToClipboard}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {extractedData?.summary 
                  ? extractedData.summary
                  : "View and download extracted data"}
              </CardDescription>
              
              {extractedData && contentProcessed && (
                <div className="flex mt-4 space-x-2">
                  <Button 
                    size="sm" 
                    variant={showResults === 'all' ? 'default' : 'outline'}
                    onClick={() => setShowResults('all')}
                  >
                    All Results
                  </Button>
                  <Button 
                    size="sm" 
                    variant={showResults === 'text' ? 'default' : 'outline'}
                    onClick={() => setShowResults('text')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Text Content
                  </Button>
                  <Button 
                    size="sm" 
                    variant={showResults === 'images' ? 'default' : 'outline'}
                    onClick={() => setShowResults('images')}
                    disabled={extractedImages.length === 0}
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    Images
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {extractedData ? (
                <div className="relative space-y-4">
                  {(showResults === 'all' || showResults === 'text') && (
                    <div>
                      {showResults === 'all' && <h3 className="text-lg font-medium mb-2">Text Content</h3>}
                      <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[500px]">
                        {extractedTextContent ? (
                          <pre className="text-xs font-mono whitespace-pre-wrap">{extractedTextContent}</pre>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">No text content extracted</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {showResults === 'all' && extractedImages.length > 0 && (
                    <Separator className="my-4" />
                  )}
                  
                  {(showResults === 'all' || showResults === 'images') && extractedImages.length > 0 && (
                    <div>
                      {showResults === 'all' && <h3 className="text-lg font-medium mb-2">Extracted Images</h3>}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {extractedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Extracted ${index}`}
                              className="object-cover w-full h-32 rounded-md border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white"
                                onClick={() => handleDownloadImage(imageUrl, index)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!contentProcessed && (
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <div className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs">
                        {extractedData.format.toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {!contentProcessed && (
                    <pre className="bg-muted/30 p-4 rounded-md overflow-auto min-h-[500px] max-h-[500px] text-xs font-mono whitespace-pre-wrap">
                      {extractedData.format === 'json' && extractedData.structured 
                        ? JSON.stringify(extractedData.structured, null, 2)
                        : extractedData.raw}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 text-muted" />
                  <p>Extract data to see results</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Powered by AI. The quality of extraction depends on the source data structure and the AI model used.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <UserGuideDataExtraction />
    </div>
  );
};

export default DataExtraction;
