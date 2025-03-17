
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, Filter, List } from 'lucide-react';
import FileUploadSection from './FileUploadSection';
import ProcessingOptionsSection from './ProcessingOptionsSection';
import FileMetadataSection from './FileMetadataSection';
import ExtractedContentSection from './ExtractedContentSection';
import ResultsSection from './ResultsSection';
import ProcessingTypesGuide from '@/components/ProcessingTypesGuide';
import { ProcessingType } from '@/services/textProcessingService';
import { SchemaFieldType } from '@/utils/fileUploadUtils';

interface DataParsingTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  fileContent: string;
  extractedText: string;
  fileMetadata: Record<string, any>;
  data: any[];
  schema: Record<string, SchemaFieldType>;
  selectedProcessingTypes: ProcessingType[];
  processingDetailLevel: 'brief' | 'standard' | 'detailed';
  processingOutputFormat: 'json' | 'text';
  userContext: string;
  aiProcessingResults: Record<string, any>;
  isLoading: boolean;
  onFileUpload: (file: File) => void;
  onProcessingTypeToggle: (type: ProcessingType) => void;
  onDetailLevelChange: (level: 'brief' | 'standard' | 'detailed') => void;
  onOutputFormatChange: (format: 'json' | 'text') => void;
  onUserContextChange: (context: string) => void;
  onProcessWithAI: () => void;
  onDownloadResults: () => void;
  renderProcessingTypeIcon: (type: ProcessingType) => React.ReactNode;
  renderProcessingTypeLabel: (type: ProcessingType) => string;
}

const DataParsingTabs: React.FC<DataParsingTabsProps> = ({
  activeTab,
  setActiveTab,
  fileContent,
  extractedText,
  fileMetadata,
  data,
  schema,
  selectedProcessingTypes,
  processingDetailLevel,
  processingOutputFormat,
  userContext,
  aiProcessingResults,
  isLoading,
  onFileUpload,
  onProcessingTypeToggle,
  onDetailLevelChange,
  onOutputFormatChange,
  onUserContextChange,
  onProcessWithAI,
  onDownloadResults,
  renderProcessingTypeIcon,
  renderProcessingTypeLabel
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="upload">
          <FileUp className="h-4 w-4 mr-2" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="analyze" disabled={!extractedText}>
          <Filter className="h-4 w-4 mr-2" />
          Analyze
        </TabsTrigger>
        <TabsTrigger value="results" disabled={Object.keys(aiProcessingResults).length === 0}>
          <List className="h-4 w-4 mr-2" />
          Results
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="space-y-6">
        <FileUploadSection
          onFileUpload={onFileUpload}
          fileContent={fileContent}
          isLoading={isLoading}
        />
        <ProcessingTypesGuide />
      </TabsContent>
      
      <TabsContent value="analyze" className="space-y-6">
        {extractedText && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FileMetadataSection fileMetadata={fileMetadata} />
              
              <ProcessingOptionsSection
                selectedProcessingTypes={selectedProcessingTypes}
                processingDetailLevel={processingDetailLevel}
                processingOutputFormat={processingOutputFormat}
                userContext={userContext}
                isLoading={isLoading}
                onProcessingTypeToggle={onProcessingTypeToggle}
                onDetailLevelChange={onDetailLevelChange}
                onOutputFormatChange={onOutputFormatChange}
                onUserContextChange={onUserContextChange}
                onProcessWithAI={onProcessWithAI}
                renderProcessingTypeIcon={renderProcessingTypeIcon}
                renderProcessingTypeLabel={renderProcessingTypeLabel}
              />
            </div>
            
            <ExtractedContentSection
              extractedText={extractedText}
              data={data}
              schema={schema}
            />
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="results" className="space-y-6">
        <ResultsSection
          aiProcessingResults={aiProcessingResults}
          onDownload={onDownloadResults}
          renderProcessingTypeIcon={renderProcessingTypeIcon}
          renderProcessingTypeLabel={renderProcessingTypeLabel}
        />
      </TabsContent>
    </Tabs>
  );
};

export default DataParsingTabs;
