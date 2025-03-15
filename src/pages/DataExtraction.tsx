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
import { 
  Download,
  Globe,
  FileType,
  Image,
  Table,
  Brackets,
  FileText,
  Copy,
  ExternalLink,
  Search
} from 'lucide-react';

const DataExtraction: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [extractionType, setExtractionType] = useState<string>('tables');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<string>('');
  const [extractedFormat, setExtractedFormat] = useState<'text' | 'json' | 'html'>('text');
  const [images, setImages] = useState<{ file: File, preview: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('web');
  const [question, setQuestion] = useState<string>('');
  const [imageQuestion, setImageQuestion] = useState<string>('');

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In a real implementation, this would call an API to extract data
      // For now, we'll simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate relevant mock data based on extraction type and question
      let mockData = '';
      
      if (question) {
        // If there's a specific question, generate an answer
        mockData = generateQuestionAnswer(url, question, extractionType);
        setExtractedFormat('text');
      } else {
        // Otherwise, extract based on the selected type
        switch (extractionType) {
          case "tables":
            mockData = JSON.stringify([
              {
                "header": ["Product", "Price", "Rating"],
                "rows": [
                  ["Product A", "$19.99", "4.5/5"],
                  ["Product B", "$24.99", "4.2/5"],
                  ["Product C", "$15.99", "4.8/5"]
                ]
              }
            ], null, 2);
            setExtractedFormat('json');
            break;
          case "lists":
            mockData = JSON.stringify({
              "lists": [
                {
                  "title": "Top Features",
                  "items": ["Feature 1", "Feature 2", "Feature 3"]
                },
                {
                  "title": "Benefits",
                  "items": ["Benefit 1", "Benefit 2", "Benefit 3"]
                }
              ]
            }, null, 2);
            setExtractedFormat('json');
            break;
          case "text":
            mockData = `Main Content from ${url}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.`;
            setExtractedFormat('text');
            break;
          case "json":
            mockData = JSON.stringify({
              "title": "Page Title",
              "meta": {
                "description": "Page description",
                "keywords": "keyword1, keyword2"
              },
              "content": {
                "heading": "Main Heading",
                "paragraphs": [
                  "Paragraph 1 content",
                  "Paragraph 2 content"
                ]
              }
            }, null, 2);
            setExtractedFormat('json');
            break;
          default:
            mockData = `Extracted content from ${url}`;
            setExtractedFormat('text');
        }
      }
      
      setExtractedData(mockData);
      toast.success('Data extracted successfully');
    } catch (error) {
      console.error('Error extracting data:', error);
      toast.error('Failed to extract data from URL');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestionAnswer = (url: string, question: string, dataType: string): string => {
    // Simulate generating an answer based on the question and URL
    // In a real implementation, this would use an API or model
    
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('price') || questionLower.includes('cost')) {
      return `Based on the data from ${url}, the prices range from $15.99 to $24.99 with an average price of $20.32.`;
    } else if (questionLower.includes('rating') || questionLower.includes('review')) {
      return `The products on ${url} have an average rating of 4.5 out of 5 stars based on 128 customer reviews.`;
    } else if (questionLower.includes('feature') || questionLower.includes('benefit')) {
      return `The main features mentioned on ${url} are:\n1. Easy to use interface\n2. Fast processing capabilities\n3. Cloud integration\n4. Mobile compatibility`;
    } else if (questionLower.includes('contact') || questionLower.includes('support')) {
      return `Contact information found on ${url}:\nEmail: support@example.com\nPhone: (555) 123-4567\nHours: Monday-Friday, 9AM-5PM EST`;
    } else {
      return `Based on the analysis of ${url}, here's what I found regarding your question about "${question}":\n\nThe website contains information that appears to be relevant to your query. The main section discusses this topic and provides several examples and explanations.`;
    }
  };

  const handleImageUpload = (file: File) => {
    // Create preview
    const preview = URL.createObjectURL(file);
    
    // Add to images array
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
      
      // Simulate image processing with a timeout
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generate mock extracted data based on whether there's a specific question
      let mockExtractedText = '';
      
      if (imageQuestion) {
        // Generate response based on the question
        mockExtractedText = generateImageQuestionAnswer(imageQuestion);
      } else {
        // General extraction from images
        mockExtractedText = images.map((_, index) => 
          `Image ${index + 1} Text Content:\n\nExtracted text from the image. This is simulated text that would be extracted using OCR technology. The actual implementation would use an OCR service or library to extract real text from the images.`
        ).join('\n\n');
      }
      
      setExtractedData(mockExtractedText);
      setExtractedFormat('text');
      toast.success('Analysis completed successfully');
    } catch (error) {
      console.error('Error extracting from images:', error);
      toast.error('Failed to extract information from images');
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageQuestionAnswer = (question: string): string => {
    // Simulate answers to specific questions about the images
    // In a real implementation, this would use computer vision APIs
    
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('text') || questionLower.includes('ocr')) {
      return "Text Extraction Results:\n\nThe image contains the following text:\n\"EXAMPLE CORPORATION\nAnnual Report 2023\nRevenue: $12.5M\nGrowth: 27%\nNew Customers: 1,542\"";
    } else if (questionLower.includes('face') || questionLower.includes('person')) {
      return "Person Detection Results:\n\n2 people detected in the image.\nPerson 1: Adult, positioned in center-frame\nPerson 2: Adult, positioned on the right side\n\nNote: For privacy reasons, detailed facial recognition is not performed.";
    } else if (questionLower.includes('object') || questionLower.includes('item')) {
      return "Object Detection Results:\n\nObjects identified in the image:\n- Laptop computer (confidence: 98%)\n- Coffee mug (confidence: 95%)\n- Notebook (confidence: 92%)\n- Pen (confidence: 89%)\n- Smartphone (confidence: 97%)";
    } else if (questionLower.includes('color') || questionLower.includes('palette')) {
      return "Color Analysis Results:\n\nDominant colors in the image:\n- Navy blue (38%)\n- White (25%)\n- Light gray (18%)\n- Black (12%)\n- Red accent (7%)";
    } else if (questionLower.includes('table') || questionLower.includes('data')) {
      return "Table Extraction Results:\n\nDetected table with the following data:\n\nMonth | Revenue | Growth\n------|---------|-------\nJan | $1.2M | 5%\nFeb | $1.3M | 8%\nMar | $1.5M | 15%\nApr | $1.7M | 13%";
    } else {
      return `Image Analysis Results for query "${question}":\n\nThe image contains content that appears to be relevant to your query. I can detect several elements that may answer your question, including text, objects, and visual information that corresponds to your interest.`;
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
      
      switch (extractedFormat) {
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
      
      const blob = new Blob([extractedData], { type: mimeType });
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
    
    navigator.clipboard.writeText(extractedData)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const clearImages = () => {
    // Revoke object URLs to avoid memory leaks
    images.forEach(image => URL.revokeObjectURL(image.preview));
    setImages([]);
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
          Extract structured data from websites, documents, and images
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
                      
                      <div>
                        <Label htmlFor="extractionType">Extraction Type</Label>
                        <select
                          id="extractionType"
                          value={extractionType}
                          onChange={(e) => setExtractionType(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                        >
                          <option value="tables">Tables</option>
                          <option value="lists">Lists</option>
                          <option value="text">Main Text Content</option>
                          <option value="json">Full Page (JSON)</option>
                        </select>
                      </div>
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
                View and download extracted data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {extractedData ? (
                <div className="relative">
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <div className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs">
                      {extractedFormat.toUpperCase()}
                    </div>
                  </div>
                  
                  <pre className="bg-muted/30 p-4 rounded-md overflow-auto min-h-[500px] max-h-[500px] text-xs font-mono whitespace-pre-wrap">
                    {extractedData}
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
                Note: This is a demo with simulated extraction. In a production environment, this would connect to real extraction services.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataExtraction;
