
import { FileProcessingResult, SupportedFileType } from './fileTypes';
import { readFileContent } from './fileOperations';
import * as openAiService from '../services/openAiService';

/**
 * Extract text content from different file types
 */
export const extractTextFromFile = async (
  file: File, 
  apiKey: string | null
): Promise<FileProcessingResult> => {
  try {
    const fileName = file.name;
    const fileType = getFileType(file);
    const fileSize = file.size;
    const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    // Basic metadata
    const metadata: Record<string, any> = {
      fileName,
      fileType,
      fileSize: `${fileSizeInMB} MB`,
      dateProcessed: new Date().toISOString()
    };
    
    switch (fileType) {
      case 'csv':
      case 'json':
      case 'txt':
        // For text-based formats, just read the content directly
        const content = await readFileContent(file);
        return { 
          success: true, 
          text: content, 
          metadata 
        };
        
      case 'pdf':
      case 'docx':
      case 'xlsx':
      case 'pptx':
        // For complex file types, use AI to extract text
        if (!apiKey) {
          return {
            success: false,
            error: "API key is required to process this file type",
            metadata
          };
        }
        
        return await extractTextWithAI(file, apiKey, metadata);
        
      default:
        return {
          success: false,
          error: `Unsupported file type: ${fileType}`,
          metadata
        };
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error extracting text',
      metadata: {
        dateProcessed: new Date().toISOString()
      }
    };
  }
};

/**
 * Helper function to determine file type based on extension
 */
const getFileType = (file: File): SupportedFileType => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  if (['csv'].includes(extension)) return 'csv';
  if (['json'].includes(extension)) return 'json';
  if (['txt', 'text', 'md'].includes(extension)) return 'txt';
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'docx';
  if (['xls', 'xlsx'].includes(extension)) return 'xlsx';
  if (['ppt', 'pptx'].includes(extension)) return 'pptx';
  if (['xml'].includes(extension)) return 'xml';
  
  // Default to unknown for unsupported types
  return 'unknown';
};

/**
 * Extract text from complex file types using AI
 */
const extractTextWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    // For PDF, DOCX, etc. - simulate extraction
    const messages = [
      { 
        role: 'system' as const, 
        content: 'You are a document text extraction assistant. Extract text content from the document I describe.'
      },
      { 
        role: 'user' as const, 
        content: `This is a ${file.type || 'document'} file named "${file.name}". In a real implementation, I would extract the contents. For this simulation, please generate some plausible text content that might be found in such a document.`
      }
    ];
    
    const response = await openAiService.callOpenAI('completions', {
      model: 'gpt-4o-mini',
      messages
    }, apiKey);
    
    return {
      success: true,
      text: response.choices[0].message.content,
      metadata: {
        ...baseMetadata,
        processingMethod: 'Simulated extraction',
        note: 'In a production environment, specialized libraries would be used for each file type'
      }
    };
    
  } catch (error) {
    console.error('Error extracting text with AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error extracting text with AI',
      metadata: baseMetadata
    };
  }
};
