
import { toast } from 'sonner';
import { openAiService } from './openAiService';

export interface EdgeCaseDetectionOptions {
  dataset: any[];
  targetColumn: string;
  edgeCaseType: string;
  complexityLevel: number;
}

export interface EdgeCaseTestingOptions {
  edgeCases: any[];
  dataset: any[];
  targetColumn: string;
}

export const edgeCaseService = {
  async detectEdgeCases(options: EdgeCaseDetectionOptions) {
    const { dataset, targetColumn, edgeCaseType, complexityLevel } = options;
    
    // Limit dataset size for API call
    const sampleSize = Math.min(dataset.length, 100);
    const datasetSample = dataset.slice(0, sampleSize);
    
    try {
      const prompt = `
      You are an expert data scientist specializing in identifying edge cases in datasets.
      
      Based on the provided dataset sample, identify ${Math.min(5, sampleSize)} potential edge cases for the target column "${targetColumn}" focusing on ${edgeCaseType}.
      
      The complexity level for detection is ${complexityLevel}/100 (higher means more extreme edge cases).
      
      For each edge case, provide:
      1. A confidence score (between 0 and 1)
      2. A detailed reason why it's an edge case
      3. An edge case score (between 1 and 100)
      
      Dataset sample: ${JSON.stringify(datasetSample.slice(0, 10))}
      
      Return your response as a valid JSON array of objects with the following structure:
      [
        {
          "${targetColumn}": "value",
          "confidence": 0.85,
          "reason": "Detailed explanation",
          "score": 75
        }
      ]
      
      ONLY return the JSON array without any explanations or other text.
      `;
      
      const response = await openAiService.callOpenAI({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in data analysis and edge case detection."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      if (!response || !response.choices || !response.choices[0].message) {
        throw new Error("Invalid response from OpenAI");
      }
      
      const resultText = response.choices[0].message.content.trim();
      
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : resultText;
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error detecting edge cases:", error);
      toast.error("Failed to detect edge cases. Please try again.");
      return [];
    }
  },
  
  async generateSyntheticCases(options: EdgeCaseDetectionOptions, generationMethod: string) {
    const { dataset, targetColumn, edgeCaseType, complexityLevel } = options;
    
    // Limit dataset size for API call
    const sampleSize = Math.min(dataset.length, 50);
    const datasetSample = dataset.slice(0, sampleSize);
    
    try {
      const prompt = `
      You are an expert data scientist specializing in generating synthetic edge cases for ML testing.
      
      Based on the provided dataset sample, generate ${Math.min(3, sampleSize)} synthetic edge cases for the target column "${targetColumn}" focusing on ${edgeCaseType}.
      
      Generation method: ${generationMethod === 'ai' ? 'AI-based generation with advanced data augmentation' : 'Domain-specific rules based on known constraints and edge conditions'}
      
      The complexity level is ${complexityLevel}/100 (higher means more extreme edge cases).
      
      For each synthetic case, provide:
      1. All the original features with modified values
      2. A confidence score (between 0 and 1)
      3. A description of what modifications were made
      4. The complexity level used
      
      Dataset sample: ${JSON.stringify(datasetSample.slice(0, 5))}
      
      Return your response as a valid JSON array of objects with all the original fields plus the additional fields.
      
      ONLY return the JSON array without any explanations or other text.
      `;
      
      const response = await openAiService.callOpenAI({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in synthetic data generation and edge case creation."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      if (!response || !response.choices || !response.choices[0].message) {
        throw new Error("Invalid response from OpenAI");
      }
      
      const resultText = response.choices[0].message.content.trim();
      
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : resultText;
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error generating synthetic cases:", error);
      toast.error("Failed to generate synthetic cases. Please try again.");
      return [];
    }
  },
  
  async testModelOnEdgeCases(options: EdgeCaseTestingOptions) {
    const { edgeCases, dataset, targetColumn } = options;
    
    try {
      const prompt = `
      You are an expert data scientist specializing in ML model evaluation.
      
      Simulate testing a model on both regular data and edge cases for the target column "${targetColumn}".
      
      Regular dataset sample: ${JSON.stringify(dataset.slice(0, 5))}
      Edge cases: ${JSON.stringify(edgeCases)}
      
      Generate a comprehensive test report with:
      1. Overall accuracy on regular data (a realistic percentage)
      2. Accuracy on edge cases (should be lower than regular accuracy)
      3. Number of false positives and false negatives
      4. A robustness score (1-10)
      5. List of features most impacted by edge cases
      6. 3-5 specific recommendations to improve model robustness
      
      Return the results as a JSON object with these fields.
      
      ONLY return the JSON object without any explanations or other text.
      `;
      
      const response = await openAiService.callOpenAI({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in ML model evaluation and testing."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      if (!response || !response.choices || !response.choices[0].message) {
        throw new Error("Invalid response from OpenAI");
      }
      
      const resultText = response.choices[0].message.content.trim();
      
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : resultText;
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error testing model on edge cases:", error);
      toast.error("Failed to test model on edge cases. Please try again.");
      return null;
    }
  },
  
  async generateDetailedReport(detectedEdgeCases: any[], generatedEdgeCases: any[], testResults: any, targetColumn: string) {
    try {
      const prompt = `
      You are an expert data scientist specializing in ML model evaluation and reporting.
      
      Generate a detailed, professional report on edge case analysis with these components:
      
      1. Executive Summary
      2. Edge Case Detection Findings (${detectedEdgeCases.length} cases found)
      3. Synthetic Edge Case Generation (${generatedEdgeCases.length} cases generated)
      4. Model Performance on Edge Cases
      5. Impact Analysis
      6. Detailed Recommendations
      7. Next Steps
      
      Edge case details: ${JSON.stringify(detectedEdgeCases.slice(0, 3))}
      Generated cases: ${JSON.stringify(generatedEdgeCases.slice(0, 2))}
      Test results: ${JSON.stringify(testResults)}
      Target column: ${targetColumn}
      
      Format the report as a well-structured markdown document with clear sections, bullet points, and tables where appropriate.
      `;
      
      const response = await openAiService.callOpenAI({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in creating detailed data science reports."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      if (!response || !response.choices || !response.choices[0].message) {
        throw new Error("Invalid response from OpenAI");
      }
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating detailed report:", error);
      toast.error("Failed to generate detailed report. Please try again.");
      return null;
    }
  },
  
  async generateRecommendationsImplementation(recommendations: string[], dataset: any[]) {
    try {
      const prompt = `
      You are an expert ML engineer specialized in improving model robustness.
      
      Based on these recommendations for handling edge cases:
      ${recommendations.join('\n')}
      
      Generate pseudocode for implementing these recommendations in a typical ML pipeline.
      Include code snippets for:
      1. Data preprocessing adjustments
      2. Feature engineering techniques
      3. Model architecture changes
      4. Training process modifications
      5. Evaluation metric adjustments
      
      Format the response as a markdown document with clear code blocks and explanations.
      `;
      
      const response = await openAiService.callOpenAI({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in ML engineering and implementation."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      if (!response || !response.choices || !response.choices[0].message) {
        throw new Error("Invalid response from OpenAI");
      }
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating recommendations implementation:", error);
      toast.error("Failed to generate implementation steps. Please try again.");
      return null;
    }
  }
};
