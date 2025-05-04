
/**
 * Utilities for extracting text from various file types
 */
import { getFileType } from './fileOperations';
import { readFileContent } from './fileOperations';
import { FileProcessingResult } from './fileTypes';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        // For complex file types, use CrewAI Vision tool
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        
        return await extractTextWithCrewAIVision(file, metadata);
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
};

/**
 * Extract text from complex file types using CrewAI Vision tool
 */
const extractTextWithCrewAIVision = async (
  file: File, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    // Create a FormData object to upload the file
    const formData = new FormData();
    formData.append('image', file);
    
    // Call the CrewAI Vision edge function
    const { data, error } = await supabase.functions.invoke('crewai-vision', {
      body: formData,
    });
    
    if (error) {
      console.error('Error calling CrewAI Vision function:', error);
      throw new Error(error.message || 'Failed to extract text from file');
    }
    
    return {
      text: data.content || 'No text was extracted',
      metadata: {
        ...baseMetadata,
        ...data.metadata,
        processingMethod: 'CrewAI Vision',
      }
    };
  } catch (error) {
    console.error('Error extracting text with CrewAI Vision:', error);
    toast.error('Failed to extract text from file. Please try again.');
    throw error;
  }
};

/**
 * Extract text from a website URL using CrewAI's web scraping tool
 * @param url The URL to scrape
 * @param cssSelector Optional CSS selector to target specific elements
 */
export const extractTextFromUrl = async (
  url: string,
  cssSelector?: string
): Promise<FileProcessingResult> => {
  try {
    // Call the CrewAI web scrape edge function
    const { data, error } = await supabase.functions.invoke('crewai-web-scrape', {
      body: { url, cssSelector },
    });
    
    if (error) {
      console.error('Error calling CrewAI web scrape function:', error);
      throw new Error(error.message || 'Failed to extract text from URL');
    }
    
    // Prepare metadata
    const metadata = {
      url,
      cssSelector: cssSelector || 'body',
      dateProcessed: new Date().toISOString(),
      processingMethod: 'CrewAI Web Scraper',
      ...data.metadata
    };
    
    return {
      text: data.content || 'No text was extracted',
      metadata
    };
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    toast.error('Failed to extract text from URL. Please try again.');
    throw error;
  }
};

/**
 * Extract text from an image URL using CrewAI's vision tool
 * @param imageUrl The URL of the image
 */
export const extractTextFromImageUrl = async (
  imageUrl: string
): Promise<FileProcessingResult> => {
  try {
    // Create a FormData object with the image URL
    const formData = new FormData();
    formData.append('imageUrl', imageUrl);
    
    // Call the CrewAI Vision edge function
    const { data, error } = await supabase.functions.invoke('crewai-vision', {
      body: formData,
    });
    
    if (error) {
      console.error('Error calling CrewAI Vision function for image URL:', error);
      throw new Error(error.message || 'Failed to extract text from image URL');
    }
    
    // Prepare metadata
    const metadata = {
      imageUrl,
      dateProcessed: new Date().toISOString(),
      processingMethod: 'CrewAI Vision',
      ...data.metadata
    };
    
    return {
      text: data.content || 'No text was extracted',
      metadata
    };
  } catch (error) {
    console.error('Error extracting text from image URL:', error);
    toast.error('Failed to extract text from image URL. Please try again.');
    throw error;
  }
};
