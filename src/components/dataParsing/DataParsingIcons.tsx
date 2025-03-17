
import React from 'react';
import { Layers, PenTool, FileSearch, Database, FileText, SmilePlus, Tag, Sparkles } from 'lucide-react';
import { ProcessingType } from '@/services/textProcessingService';

export const renderProcessingTypeIcon = (type: ProcessingType): React.ReactNode => {
  switch (type) {
    case 'structuring':
      return <Layers className="h-4 w-4" />;
    case 'cleaning':
      return <PenTool className="h-4 w-4" />;
    case 'ner':
      return <FileSearch className="h-4 w-4" />;
    case 'topics':
      return <Database className="h-4 w-4" />;
    case 'summarization':
      return <FileText className="h-4 w-4" />;
    case 'sentiment':
      return <SmilePlus className="h-4 w-4" />;
    case 'tagging':
      return <Tag className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
};

export const renderProcessingTypeLabel = (type: ProcessingType): string => {
  switch (type) {
    case 'structuring':
      return 'Auto-Structuring';
    case 'cleaning':
      return 'Data Cleaning';
    case 'ner':
      return 'Named Entity Recognition';
    case 'topics':
      return 'Topic Extraction';
    case 'summarization':
      return 'Summarization';
    case 'sentiment':
      return 'Sentiment Analysis';
    case 'tagging':
      return 'Auto-Tagging';
    default:
      return type;
  }
};
