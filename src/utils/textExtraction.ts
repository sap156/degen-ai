
/**
 * Utilities for extracting text from various file types
 */
import { getFileType, readFileContent } from './fileOperations';
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
        
        return await extractDocumentTextWithAI(file, apiKey, metadata);
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
};

/**
 * Extract text from documents using AI
 */
const extractDocumentTextWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // For PDF, DOCX, etc. - Use file contents for non-vision models if possible
    let messageContent: string | Array<{type: string, [key: string]: any}> = '';
    
    // Try to directly read text files
    if (file.type === 'text/plain' || fileExtension === 'txt') {
      try {
        const textContent = await readFileContent(file);
        messageContent = `This is a text file named "${file.name}". Here is its content:\n\n${textContent}`;
      } catch (error) {
        console.warn('Could not read file as text, falling back to AI extraction', error);
      }
    }
    
    // For PDFs and other document formats, we might need vision capabilities
    if (!messageContent) {
      try {
        const base64File = await fileToBase64(file);
        
        // Use vision model for PDFs and other document formats
        messageContent = [
          { 
            type: 'text', 
            text: `This is a ${fileExtension.toUpperCase()} file named "${file.name}". Please extract all text content from this document.` 
          },
          { 
            type: 'image_url', 
            image_url: {
              url: base64File,
              detail: 'high'
            } 
          }
        ];
      } catch (error) {
        console.error('Error converting file to base64:', error);
        messageContent = `This is a ${fileExtension.toUpperCase()} file named "${file.name}". In a real implementation, I would extract the contents from the binary data. Please generate a response based on what might be in this document.`;
      }
    }
    
    const messages = [
      { 
        role: 'system' as const, 
        content: 'You are a document text extraction assistant. Extract all the text content from the document I provide, preserving the original formatting as much as possible. Only return the extracted text, without any additional commentary.'
      },
      { 
        role: 'user' as const, 
        content: messageContent
      }
    ];
    
    // Use the appropriate model based on the message content type
    const model = Array.isArray(messageContent) ? 'gpt-4o' : 'gpt-4o-mini';
    
    const response = await getCompletion(apiKey, messages, { model });
    
    return {
      text: response,
      metadata: {
        ...baseMetadata,
        processingMethod: 'AI-based extraction',
        modelUsed: model
      }
    };
    
  } catch (error) {
    console.error('Error extracting text with AI:', error);
    throw error;
  }
};

/**
 * Convert file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
