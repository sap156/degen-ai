
import { DatasetInfo } from './types';
import { getCompletion } from '../openAiService';

/**
 * Get AI-powered recommendations for handling imbalanced data
 * @param datasetInfo Information about the dataset
 * @param apiKey OpenAI API key
 * @returns AI-generated recommendations
 */
export const getAIRecommendations = async (
  datasetInfo: DatasetInfo,
  apiKey: string
): Promise<string> => {
  try {
    const messages = [
      {
        role: "system",
        content: "You are a machine learning expert specializing in imbalanced datasets. Provide detailed, actionable recommendations for handling class imbalance."
      },
      {
        role: "user",
        content: `Analyze this imbalanced dataset and provide recommendations:
        
Total Samples: ${datasetInfo.totalSamples}
Imbalance Ratio: ${datasetInfo.imbalanceRatio}:1
Class Distribution: ${JSON.stringify(datasetInfo.classes.map(c => ({ 
  className: c.className, 
  count: c.count, 
  percentage: c.percentage 
})))}

Please provide:
1. A thorough analysis of the imbalance situation
2. Recommended techniques to address the imbalance
3. Suggestions for evaluation metrics
4. Model selection advice

Format your response in markdown.`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.7,
      max_tokens: 1000
    });

    return response;
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw new Error("Failed to generate AI recommendations");
  }
};
