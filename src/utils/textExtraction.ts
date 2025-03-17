
import { toast } from "sonner";
import { getCompletion, createMessages, OpenAiMessage } from "../services/openAiService";
import { readFileContent } from "./fileOperations";

interface ExtractedTextResult {
  text: string;
  metadata: Record<string, any>;
  keywords: string[];
}

export const extractKeywords = async (
  text: string,
  apiKey: string | null
): Promise<string[]> => {
  if (!apiKey) {
    toast.error("API key is not set");
    return [];
  }

  const systemMessage = "You are an expert keyword extractor. Your task is to identify the most relevant keywords from the given text.";
  const userMessage = `Please extract the 5 most important keywords from the following text:\n\n${text}`;

  const messages = createMessages(systemMessage, userMessage);

  try {
    const response = await getCompletion(apiKey, messages);
    // Split the response into keywords, removing any extra spaces or commas
    return response.split(",").map((keyword) => keyword.trim());
  } catch (error) {
    console.error("Error extracting keywords:", error);
    toast.error("Failed to extract keywords. Please try again.");
    return [];
  }
};

/**
 * Extract text and metadata from a file
 * @param file The file to extract text from
 * @param apiKey OpenAI API key for enhanced extraction
 * @returns Object with extracted text, metadata and keywords
 */
export const extractTextFromFile = async (
  file: File,
  apiKey: string | null
): Promise<ExtractedTextResult> => {
  try {
    // Basic metadata
    const metadata: Record<string, any> = {
      filename: file.name,
      filesize: `${(file.size / 1024).toFixed(2)} KB`,
      filetype: file.type || 'Unknown',
      lastModified: new Date(file.lastModified).toISOString()
    };

    // Extract content based on file type
    let text = '';
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (['txt', 'csv', 'json', 'md'].includes(fileType)) {
      // For text-based files, read directly
      text = await readFileContent(file);
    } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)) {
      // For document files that need AI processing
      if (!apiKey) {
        toast.error("API key required for processing this file type");
        return { text: "", metadata, keywords: [] };
      }
      
      text = await extractDocumentText(file, apiKey);
      metadata.extraction_method = "AI-assisted";
    } else {
      // Unsupported file type
      toast.error("Unsupported file type for text extraction");
      return { text: "", metadata, keywords: [] };
    }
    
    // Extract keywords from the text if we have content and an API key
    let keywords: string[] = [];
    if (text && apiKey) {
      keywords = await extractKeywords(text, apiKey);
      metadata.keyword_count = keywords.length;
    }
    
    return { text, metadata, keywords };
  } catch (error) {
    console.error("Error in text extraction:", error);
    toast.error("Failed to extract text from file");
    return { 
      text: "", 
      metadata: { 
        filename: file.name,
        error: "Extraction failed" 
      }, 
      keywords: [] 
    };
  }
};

/**
 * Extract text from document files using AI
 */
const extractDocumentText = async (file: File, apiKey: string): Promise<string> => {
  // This is a placeholder - in a real implementation, you would:
  // 1. Convert the file to base64
  // 2. Send it to OpenAI's API with vision capabilities
  // 3. Ask the AI to extract all text from the document
  
  // For now, we'll just return a placeholder message
  return `This is a placeholder for text extraction from ${file.name}. In a real implementation, the content would be extracted using OpenAI's API.`;
};
