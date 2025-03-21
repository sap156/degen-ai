import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import UserGuidePiiHandling from '@/components/ui/UserGuidePiiHandling';

const PiiHandlingContent = () => {
  return (
    <div className="container mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PII Data Handling</h1>
        <p className="text-muted-foreground mt-2">
          Securely handle Personally Identifiable Information (PII) with AI-powered masking and anonymization techniques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Configure masking options and export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Generate</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor="record-count">Number of Records</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="record-count"
                        type="number"
                        min="1"
                        max="100"
                        value={dataCount}
                        onChange={(e) => setDataCount(parseInt(e.target.value) || 10)}
                      />
                      <Button onClick={generateData} size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Upload JSON or CSV file</Label>
                    <FileUploader
                      onFileUpload={handleFileUpload}
                      accept=".json,.csv"
                      maxSize={5}
                      title="Upload Schema"
                      description="Upload a JSON or CSV file with sample data"
                    />
                  </div>
                  
                  {isProcessingFile && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm">Processing file...</span>
                    </div>
                  )}
                  
                  {uploadedFile && !isProcessingFile && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <p className="font-medium">File: {uploadedFile.name}</p>
                      <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                      <p>Records: {originalData.length}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Schema Management</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => analyzeDataWithAi(originalData)}
                  disabled={!apiKey || isAnalyzingData || originalData.length === 0}
                >
                  {isAnalyzingData ? (
                    <>
                      <div className="animate-spin h-3 w-3 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Analyze PII
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Select fields to mask and provide instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {piiAnalysisResult && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm space-y-2 mb-2">
                  <p className="font-medium text-blue-700 dark:text-blue-300">PII Analysis Results:</p>
                  <p className="text-sm">Identified: {piiAnalysisResult.identifiedPii.join(', ')}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {piiAnalysisResult.suggestions.substring(0, 120)}
                    {piiAnalysisResult.suggestions.length > 120 ? '...' : ''}
                  </p>
                </div>
              )}
              
              <div className="border rounded-md p-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-masking-prompt" className="text-sm font-medium">
                      AI Masking Instructions
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]" align="end">
                          <p className="text-xs">
                            Provide specific instructions for how you want each field masked.
                            For example: "Mask emails by keeping the domain but replace username with asterisks.
                            Replace all digits in credit cards except the last 4."
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea 
                    id="ai-masking-prompt"
                    placeholder="Describe exactly how you want each field masked. Be specific about techniques and formats."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                  
                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground mb-2 block">Example instructions:</Label>
                    <div className="space-y-2">
                      {examplePrompts.map((prompt, index) => (
                        <div 
                          key={index}
                          className="text-xs p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => setAiPrompt(prompt)}
                        >
                          {prompt.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <Label htmlFor="preserve-format" className="text-xs">Preserve Format</Label>
                  <div className="flex h-8 items-center space-x-2">
                    <div className={`px-3 py-1 text-xs rounded-l-md cursor-pointer ${!globalMaskingPreferences.preserveFormat ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        onClick={() => handlePreserveFormatToggle(false)}>
                      No
                    </div>
                    <div className={`px-3 py-1 text-xs rounded-r-md cursor-pointer ${globalMaskingPreferences.preserveFormat ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        onClick={() => handlePreserveFormatToggle(true)}>
                      Yes
                    </div>
                  </div>
                </div>
              </div>
              
              {dataReady && (
                <Button 
                  className="w-full mt-4" 
                  onClick={applyMasking}
                  disabled={isMaskingData || originalData.length === 0 || !apiKey}
                >
                  {isMaskingData ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate PII Masking
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Export or copy your masked data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-sm">Format</Label>
                <div className="flex items-center space-x-2">
                  <div
                    className={`px-3 py-1 text-xs rounded-l-md cursor-pointer ${exportFormat === 'json' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setExportFormat('json')}
                  >
                    JSON
                  </div>
                  <div
                    className={`px-3 py-1 text-xs rounded-r-md cursor-pointer ${exportFormat === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setExportFormat('csv')}
                  >
                    CSV
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => handleExport(maskedData)} 
                  className="w-full"
                  disabled={maskedData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Masked Data
                </Button>
                <Button 
                  onClick={() => copyToClipboard(maskedData)} 
                  variant="outline" 
                  className="w-full"
                  disabled={maskedData.length === 0}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Fields to Mask</CardTitle>
                {isMaskingData && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Applying AI masking...
                  </div>
                )}
              </div>
              <CardDescription>
                Select which fields should be masked by the AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(perFieldMaskingOptions).map(([field, config]) => (
                  <MaskingFieldControl 
                    key={field}
                    field={field}
                    enabled={config.enabled}
                    onToggle={() => toggleFieldMasking(field)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>PII Data Viewer</CardTitle>
              <CardDescription>
                View original and masked PII data side by side (showing first 5 records)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="original">
                <TabsList>
                  <TabsTrigger value="original">Original Data</TabsTrigger>
                  <TabsTrigger value="masked">Masked Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="original">
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          {originalData.length > 0 && 
                            Object.keys(originalData[0])
                              .filter(k => k !== 'id')
                              .map(field => (
                                <TableHead key={field}>{field}</TableHead>
                              ))
                          }
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {originalData.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            {Object.entries(item)
                              .filter(([key]) => key !== 'id')
                              .map(([key, value]) => (
                                <TableCell key={key} className="max-w-[200px] truncate">
                                  {value}
                                </TableCell>
                              ))
                            }
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {originalData.length > 5 && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Showing 5 of {originalData.length} records
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="masked">
                  {maskedData.length > 0 ? (
                    <div className="border rounded-md overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            {maskedData.length > 0 && 
                              Object.keys(maskedData[0])
                                .filter(k => k !== 'id')
                                .map(field => (
                                  <TableHead key={field}>{field}</TableHead>
                                ))
                            }
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maskedData.slice(0, 5).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id}</TableCell>
                              {Object.entries(item)
                                .filter(([key]) => key !== 'id')
                                .map(([key, value]) => (
                                  <TableCell key={key} className="max-w-[200px] truncate">
                                    {value}
                                  </TableCell>
                                ))
                              }
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {maskedData.length > 5 && (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Showing 5 of {maskedData.length} records
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
                      <p className="text-muted-foreground mb-2">No masked data available</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={applyMasking}
                        disabled={isMaskingData || originalData.length === 0 || !apiKey}
                      >
                        Generate PII Masking
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <UserGuidePiiHandling />
    </div>
  );
};

const PiiHandling = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">PII Data Handling</h1>
        <AuthRequirement showUserGuide={<UserGuidePiiHandling />} />
      </div>
    );
  }

  return <PiiHandlingContent />;
};

export default PiiHandling;
