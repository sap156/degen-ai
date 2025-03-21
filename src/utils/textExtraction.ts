
/**
 * Utilities for extracting text from various file types
 */
import { getFileType } from './fileOperations';
import { readFileContent } from './fileOperations';
import { FileProcessingResult } from './fileTypes';

/**
 * Extract text content from a file using appropriate method based on file type
 * @param file The file to process
 * @param apiKey OpenAI API key for processing complex file types
 * @returns Promise resolving to the extracted text content
 */
export const extractTextFromFile = async (
  file: File, 
  apiKey: string | null
): Promise<FileProcessingResult> => {
  const fileType = getFileType(file);
  const fileName = file.name;
  const fileSize = file.size;
  const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
  
  // Basic metadata that's available for all files
  const metadata: Record<string, any> = {
    fileName,
    fileType,
    fileSize: `${fileSizeInMB} MB`,
    dateProcessed: new Date().toISOString()
  };
  
  try {
    switch (fileType) {
      case 'csv':
      case 'json':
      case 'txt':
        // For text-based formats, just read the content directly
        const content = await readFileContent(file);
        return { text: content, metadata };
        
      case 'pdf':
      case 'docx':
      case 'xlsx':
      case 'pptx':
        // For complex file types, use AI to extract text
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        
        return await extractTextWithAI(file, apiKey, metadata);
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
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
    const { getCompletion } = await import('../services/openAiService');
    
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
    
    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 16384
    });
    
    return {
      text: response,
      metadata: {
        ...baseMetadata,
        processingMethod: 'Simulated extraction',
        note: 'In a production environment, specialized libraries would be used for each file type'
      }
    };
    
  } catch (error) {
    console.error('Error extracting text with AI:', error);
    throw error;
  }
};
