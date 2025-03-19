import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import UserGuideDataExtraction from '@/components/ui/UserGuideDataExtraction';

const DataExtraction: React.FC = () => {
  const { apiKey, isKeySet } = useApiKey();
  const [url, setUrl] = useState<string>('');
  const [extractionType, setExtractionType] = useState<ExtractionType>('tables');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [images, setImages] = useState<{ file: File, preview: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('web');
  const [question, setQuestion] = useState<string>('');
  const [imageQuestion, setImageQuestion] = useState<string>('');
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [isProcessingFollowUp, setIsProcessingFollowUp] = useState<boolean>(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await extractDataFromUrl(
        apiKey, 
        url, 
        extractionType, 
        question.trim() || undefined
      );
      
      setExtractedData(result);
      toast.success('Data extracted successfully');
    } catch (error) {
      console.error('Error extracting data:', error);
      toast.error('Failed to extract data from URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const preview = URL.createObjectURL(file);
    
    setImages(prev => [...prev, { file, preview }]);
    
    toast.success(`Image uploaded: ${file.name}`);
  };

  const handleExtractFromImages = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = await extractDataFromImage(
        apiKey,
        images[0].file,
        extractionType === 'tables' ? 'key-value' : extractionType,
        imageQuestion.trim() || undefined
      );
      
      setExtractedData(result);
      toast.success('Analysis completed successfully');
    } catch (error) {
      console.error('Error extracting from images:', error);
      toast.error('Failed to extract information from images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = async () => {
    if (!extractedData || !followUpQuestion.trim()) {
      toast.error('Please extract data and enter a follow-up question');
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
      
      const blob = new Blob([extractedData.raw], { type: mimeType });
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
    
    navigator.clipboard.writeText(extractedData.raw)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const clearImages = () => {
    images.forEach(image => URL.revokeObjectURL(image.preview));
    setImages([]);
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
          { value: 'text', label: 'Full Text (OCR)', icon: <FileText className="h-4 w-4 mr-2" /> },
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

  if (!isKeySet) {
    return <ApiKeyRequirement />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-8 w-8 text-primary" />
          Data Extraction
        </h1>
        <p className="text-muted-foreground">
          Extract structured data from unstructured sources like web pages, PDFs, and documents
        </p>
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
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="web">
                    <Globe className="h-4 w-4 mr-2" />
                    Web
                  </TabsTrigger>
                  <TabsTrigger value="images">
                    <Image className="h-4 w-4 mr-2" />
                    Images
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
                      onFileUpload={handleImageUpload}
                      accept=".jpg,.jpeg,.png,.webp,.tiff,.pdf"
                      maxSize={10}
                      title="Upload Images"
                      description="Upload images to extract text using OCR"
                    />
                  </div>
                  
                  {images.length > 0 && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="imageQuestion">Ask a specific question (optional)</Label>
                        <Textarea
                          id="imageQuestion"
                          placeholder="E.g., Extract text from this image. What objects are in this image?"
                          value={imageQuestion}
                          onChange={(e) => setImageQuestion(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      
                      {renderExtractionTypeOptions()}
                      
                      <div className="grid grid-cols-2 gap-2">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.preview}
                              alt={`Uploaded ${index}`}
                              className="object-cover w-full h-32 rounded-md border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                              <span className="text-white text-xs">
                                {image.file.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleExtractFromImages}
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
                          onClick={clearImages}
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
          
          {extractedData && (
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
            </CardHeader>
            <CardContent>
              {extractedData ? (
                <div className="relative">
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <div className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs">
                      {extractedData.format.toUpperCase()}
                    </div>
                  </div>
                  
                  <pre className="bg-muted/30 p-4 rounded-md overflow-auto min-h-[500px] max-h-[500px] text-xs font-mono whitespace-pre-wrap">
                    {extractedData.format === 'json' && extractedData.structured 
                      ? JSON.stringify(extractedData.structured, null, 2)
                      : extractedData.raw}
                  </pre>
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
