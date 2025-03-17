
import { toast } from "sonner";
import { getCompletion, createMessages, OpenAiMessage } from "../services/openAiService";

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

// Fix the export for DataParsing.tsx
export const extractTextFromFile = extractKeywords;
