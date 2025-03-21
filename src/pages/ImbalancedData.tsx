import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import UserGuideImbalancedData from '@/components/ui/UserGuideImbalancedData';

const ImbalancedDataContent = () => {
  // Existing code from ImbalancedData.tsx
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="container mx-auto py-6 space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Imbalanced Data Handling</h1>
        <p className="text-muted-foreground mt-2">
          Balance your datasets using various techniques to improve model performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Controls</CardTitle>
              <CardDescription>Upload your dataset to begin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUploader
                onFileUpload={handleFileUpload}
                accept=".csv, .json, .parquet"
                title="Upload Dataset"
                description="Upload a CSV, JSON or Parquet file with your imbalanced dataset"
              />
              
              {uploadedFile && (
                <div className="text-sm text-muted-foreground mt-2">
                  <p className="font-medium">File: {uploadedFile.name}</p>
                  <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <AIDatasetConfiguration
            datasetAnalysis={datasetAnalysis}
            isLoading={isAnalyzing}
            onConfigurationComplete={handleDatasetConfigurationComplete}
            apiKeyAvailable={!!apiKey}
          />
          
          {originalDataset && (
            <DataBalancingControls
              originalDataset={originalDataset}
              parsedData={parsedData}
              onBalanceDataset={handleBalanceDataset}
              onDownloadBalanced={handleDownloadBalanced}
              hasBalancedData={!!balancedDataset}
              aiRecommendationsAvailable={!!aiRecommendations}
            />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Visualize the balance between different classes</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={chartType === 'pie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('pie')}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="original">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="original">Original Dataset</TabsTrigger>
                  <TabsTrigger value="balanced" disabled={!balancedDataset}>Balanced Dataset</TabsTrigger>
                </TabsList>
                
                <TabsContent value="original" className="pt-4">
                  {originalDataset ? (
                    <div className="space-y-6">
                      <div className="h-[300px] flex items-center justify-center">
                        {chartType === 'pie' ? (
                          <Pie data={prepareChartData(originalDataset)} />
                        ) : (
                          <Bar
                            data={prepareChartData(originalDataset)}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Dataset Summary</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="space-y-1">
                            <p><span className="font-medium">Total Samples:</span> {originalDataset.totalSamples}</p>
                            <p><span className="font-medium">Number of Classes:</span> {originalDataset.classes.length}</p>
                          </div>
                          <div className="space-y-1">
                            <p><span className="font-medium">Imbalance Ratio:</span> {originalDataset.imbalanceRatio}:1</p>
                            <p>
                              <span className="font-medium">Status:</span>{' '}
                              <span className={originalDataset.isImbalanced ? 'text-orange-500' : 'text-green-500'}>
                                {originalDataset.isImbalanced ? 'Imbalanced' : 'Balanced'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <h3 className="font-medium mb-2">Class Distribution</h3>
                        <div className="grid grid-cols-4 gap-2 text-sm font-medium mb-2">
                          <div>Class</div>
                          <div>Count</div>
                          <div>Percentage</div>
                          <div></div>
                        </div>
                        <div className="space-y-2">
                          {originalDataset.classes.map((cls) => (
                            <div key={cls.className} className="grid grid-cols-4 gap-2 text-sm items-center">
                              <div>{cls.className}</div>
                              <div>{cls.count}</div>
                              <div>{cls.percentage}%</div>
                              <div className="flex items-center">
                                <div 
                                  className="h-3 rounded" 
                                  style={{
                                    backgroundColor: cls.color,
                                    width: `${Math.max(cls.percentage, 5)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="rounded-full bg-muted p-3 mb-4">
                        <BarChart className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-1">No Dataset Available</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Upload a dataset to visualize the class distribution.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="balanced" className="pt-4">
                  {balancedDataset ? (
                    <div className="space-y-6">
                      <div className="h-[300px] flex items-center justify-center">
                        {chartType === 'pie' ? (
                          <Pie data={prepareChartData(balancedDataset)} />
                        ) : (
                          <Bar
                            data={prepareChartData(balancedDataset)}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-lg mb-2">Balanced Dataset Summary</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="space-y-1">
                            <p><span className="font-medium">Total Samples:</span> {balancedDataset.totalSamples}</p>
                            <p><span className="font-medium">Number of Classes:</span> {balancedDataset.classes.length}</p>
                          </div>
                          <div className="space-y-1">
                            <p><span className="font-medium">New Imbalance Ratio:</span> {balancedDataset.imbalanceRatio}:1</p>
                            <p>
                              <span className="font-medium">Status:</span>{' '}
                              <span className={balancedDataset.isImbalanced ? 'text-orange-500' : 'text-green-500'}>
                                {balancedDataset.isImbalanced ? 'Still Imbalanced' : 'Balanced'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <h3 className="font-medium mb-2">Balanced Class Distribution</h3>
                        <div className="grid grid-cols-4 gap-2 text-sm font-medium mb-2">
                          <div>Class</div>
                          <div>Count</div>
                          <div>Percentage</div>
                          <div></div>
                        </div>
                        <div className="space-y-2">
                          {balancedDataset.classes.map((cls) => (
                            <div key={cls.className} className="grid grid-cols-4 gap-2 text-sm items-center">
                              <div>{cls.className}</div>
                              <div>{cls.count}</div>
                              <div>{cls.percentage}%</div>
                              <div className="flex items-center">
                                <div 
                                  className="h-3 rounded" 
                                  style={{
                                    backgroundColor: cls.color,
                                    width: `${Math.max(cls.percentage, 5)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {balancedParsedData.length > 0 && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Balanced Records Preview</h3>
                          <div className="text-sm text-muted-foreground mb-2">
                            Generated {balancedParsedData.length} records using {balancedDataset.classes.length} classes
                          </div>
                          <div className="border rounded-md p-3 max-h-60 overflow-auto">
                            <pre className="text-xs">{JSON.stringify(balancedParsedData.slice(0, 5), null, 2)}</pre>
                            {balancedParsedData.length > 5 && (
                              <div className="text-xs text-center mt-2 text-muted-foreground">
                                ... and {balancedParsedData.length - 5} more records
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadBalanced('csv')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadBalanced('json')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export JSON
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">Apply balancing to see results</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <AIDatasetAnalysis
            datasetAnalysis={datasetAnalysis}
            preferences={datasetPreferences}
            apiKeyAvailable={!!apiKey}
            onRequestAnalysis={getAIRecommendations}
            isLoading={isLoadingRecommendations}
            aiRecommendations={aiRecommendations}
            originalDataset={originalDataset}
          />
        </div>
      </div>

      <UserGuideImbalancedData />
    </motion.div>
  );
};

const ImbalancedData = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Imbalanced Data Handling</h1>
        <AuthRequirement showUserGuide={<UserGuideImbalancedData />} />
      </div>
    );
  }

  return <ImbalancedDataContent />;
};

export default ImbalancedData;
