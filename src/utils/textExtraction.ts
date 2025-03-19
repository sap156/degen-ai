
/**
 * Utilities for extracting text from various file types
 */
import { getFileType } from './fileOperations';
import { readFileContent } from './fileOperations';
import { FileProcessingResult, SupportedFileType } from './fileTypes';
import { autoDetectAndParse } from './dataParsing';

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
      case 'xml':
        // For text-based formats, just read the content directly
        const content = await readFileContent(file);
        return { text: content, metadata };
        
      case 'pdf':
      case 'docx':
      case 'doc' as SupportedFileType:
      case 'xlsx':
      case 'xls' as SupportedFileType:
      case 'pptx':
      case 'ppt' as SupportedFileType:
        // For complex file types, use AI to extract text
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        
        return await extractTextWithAI(file, apiKey, metadata);
        
      default:
        // Try to extract with AI for unknown file types
        if (apiKey) {
          return await extractTextWithAI(file, apiKey, metadata);
        }
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
    
    // Create a more detailed prompt based on file type
    const fileType = baseMetadata.fileType;
    let extractionPrompt = '';
    
    switch (fileType) {
      case 'pdf':
        extractionPrompt = 'Extract all text content from this PDF file, preserving paragraph structure, headings, and lists where possible.';
        break;
      case 'docx':
      case 'doc':
        extractionPrompt = 'Extract all text content from this Word document, preserving paragraph structure, headings, tables, and formatting where possible.';
        break;
      case 'xlsx':
      case 'xls':
        extractionPrompt = 'Extract and organize data from this Excel spreadsheet. Format tables with proper column headers and row values.';
        break;
      case 'pptx':
      case 'ppt':
        extractionPrompt = 'Extract all text content from this PowerPoint presentation, organizing by slides and preserving bullet points, titles, and content structure.';
        break;
      default:
        extractionPrompt = `Extract all text content from this ${fileType} file, preserving the original structure as much as possible.`;
    }
    
    // For all document types, include instructions to handle structured data
    extractionPrompt += ' If you detect structured data (tables, lists, etc.), try to preserve that structure. If the content appears to be in a specific format like CSV or JSON, present it in that structured format.';
    
    // File content will be simulated for this example, but would be sent via API in real implementation
    // In production, we would pass file content using formData with the API request
    
    const messages = [
      { 
        role: 'system' as const, 
        content: `You are a document text extraction expert specialized in extracting and structuring content from ${fileType} files. Your task is to extract text in a way that preserves the document's original structure and format as much as possible.`
      },
      { 
        role: 'user' as const, 
        content: `This is a ${file.type || fileType} file named "${file.name}" with a size of ${baseMetadata.fileSize}. ${extractionPrompt}`
      }
    ];
    
    console.log(`Extracting text from ${fileType} file using AI...`);
    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini'
    });
    
    // Try to parse the response if it appears to be in a structured format
    let structuredContent = response;
    try {
      // See if the AI response contains structured data we can parse
      if (response.includes('{') && response.includes('}')) {
        const possibleJson = response.substring(
          response.indexOf('{'), 
          response.lastIndexOf('}') + 1
        );
        const parsed = JSON.parse(possibleJson);
        // If parsing succeeds, update the extraction method
        baseMetadata.structuredFormat = 'json';
        structuredContent = JSON.stringify(parsed, null, 2);
      } 
      else if (response.includes('[') && response.includes(']')) {
        const possibleArray = response.substring(
          response.indexOf('['), 
          response.lastIndexOf(']') + 1
        );
        const parsed = JSON.parse(possibleArray);
        baseMetadata.structuredFormat = 'json';
        structuredContent = JSON.stringify(parsed, null, 2);
      }
      else if (response.includes(',') && response.includes('\n')) {
        // Check if it looks like CSV data
        const lines = response.split('\n').filter(l => l.trim());
        if (lines.length > 1 && lines[0].includes(',') && lines[1].includes(',')) {
          baseMetadata.structuredFormat = 'csv';
        }
      }
    } catch (e) {
      // If parsing fails, just use the raw response
      console.log('Could not parse structured data from AI response');
    }
    
    return {
      text: structuredContent,
      metadata: {
        ...baseMetadata,
        processingMethod: 'AI-based extraction',
        aiModel: 'gpt-4o-mini',
        contentLength: response.length
      }
    };
    
  } catch (error) {
    console.error('Error extracting text with AI:', error);
    throw error;
  }
};

/**
 * Extract structured data from text content using AI
 * @param text The text content to process
 * @param apiKey OpenAI API key for processing
 * @param format The desired output format
 * @returns Promise resolving to structured data
 */
export const extractStructuredDataWithAI = async (
  text: string,
  apiKey: string,
  format: 'json' | 'csv' = 'json'
): Promise<any> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    
    // First, try to auto-detect and parse the content
    try {
      const parsedData = autoDetectAndParse(text);
      if (parsedData && (Array.isArray(parsedData) || typeof parsedData === 'object')) {
        return parsedData;
      }
    } catch (e) {
      // If auto-detection fails, continue with AI processing
      console.log('Auto-detection failed, proceeding with AI processing');
    }
    
    // Use AI to extract structured data
    const messages = [
      { 
        role: 'system' as const, 
        content: `You are a data extraction expert. Extract structured data from the provided text and return it in ${format === 'json' ? 'JSON format' : 'CSV format with comma-separated values'}.`
      },
      { 
        role: 'user' as const, 
        content: `Extract structured data from the following text and return it in ${format} format:\n\n${text}`
      }
    ];
    
    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini'
    });
    
    if (format === 'json') {
      // Try to extract JSON from the response
      try {
        const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```|(\{[\s\S]*\}|\[[\s\S]*\])/;
        const match = response.match(jsonRegex);
        
        if (match) {
          const jsonString = (match[1] || match[2]).trim();
          return JSON.parse(jsonString);
        } else {
          // If no JSON block found, try parsing the entire response
          return JSON.parse(response);
        }
      } catch (e) {
        console.error('Failed to parse JSON from AI response:', e);
        return { raw: response };
      }
    } else {
      // Return CSV as is, client can parse it if needed
      return response;
    }
  } catch (error) {
    console.error('Error extracting structured data with AI:', error);
    throw error;
  }
};
