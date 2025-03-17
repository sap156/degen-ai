
import { useSupabase } from '@/hooks/useSupabase';

// Define interface for the analysis options
export interface DataAnalysisOptions {
  analysisType: 'statistics' | 'correlation' | 'anomalies' | 'recommendations' | 'insights';
  datasetName?: string;
  targetColumn?: string;
  advancedOptions?: Record<string, any>;
}

// Function to analyze data using AI
export const analyzeDataWithAI = async (
  data: object[], 
  options: DataAnalysisOptions,
  apiKey: string | null
) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for data analysis');
  }

  if (!data || data.length === 0) {
    throw new Error('No data provided for analysis');
  }

  // Sample the data if it's too large (to avoid token limits)
  const sampledData = data.length > 50 ? sampleData(data, 50) : data;
  
  // Create a prompt based on the analysis type
  const prompt = createAnalysisPrompt(sampledData, options);

  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      temperature: 0.2, // Lower temperature for more consistent analysis
      max_tokens: 1500
    });

    if (response.choices && response.choices.length > 0) {
      return {
        analysis: response.choices[0].message.content,
        analysisType: options.analysisType,
        timestamp: new Date().toISOString(),
        datasetInfo: {
          name: options.datasetName || 'Unnamed Dataset',
          recordCount: data.length,
          sampleSize: sampledData.length
        }
      };
    } else {
      throw new Error('No analysis response received from AI');
    }
  } catch (error) {
    console.error('Error analyzing data with AI:', error);
    throw error;
  }
};

// Function to sample data for analysis
const sampleData = (data: object[], sampleSize: number) => {
  if (data.length <= sampleSize) return data;
  
  const result = [];
  const step = Math.floor(data.length / sampleSize);
  
  // Take evenly distributed samples
  for (let i = 0; i < sampleSize; i++) {
    result.push(data[i * step]);
  }
  
  return result;
};

// Function to create analysis prompts based on analysis type
const createAnalysisPrompt = (data: object[], options: DataAnalysisOptions) => {
  const dataString = JSON.stringify(data);
  const { analysisType, targetColumn, advancedOptions } = options;
  
  let systemPrompt = `You are a data analysis assistant specializing in ${analysisType} analysis. 
  Provide clear, concise insights that would be valuable to a data engineer or analyst.`;
  
  let userPrompt = `Analyze the following dataset${targetColumn ? ` focusing on the column "${targetColumn}"` : ''}:
  ${dataString}`;

  // Add specific instructions based on analysis type
  switch (analysisType) {
    case 'statistics':
      systemPrompt += ` Focus on identifying key statistical properties, distributions, and summary metrics.`;
      userPrompt += `\nProvide comprehensive statistical analysis including mean, median, mode, range, and distribution characteristics for key columns.`;
      break;
      
    case 'correlation':
      systemPrompt += ` Identify relationships, dependencies, and correlations between variables.`;
      userPrompt += `\nAnalyze correlations between columns, identifying strong positive or negative relationships. Calculate correlation coefficients where applicable.`;
      break;
      
    case 'anomalies':
      systemPrompt += ` Detect outliers, inconsistencies, and unusual patterns in the data.`;
      userPrompt += `\nIdentify anomalies, outliers, and unusual data points. Explain why these points are considered anomalous and their potential impact.`;
      break;
      
    case 'recommendations':
      systemPrompt += ` Provide actionable recommendations for data improvement and usage.`;
      userPrompt += `\nSuggest specific improvements for this dataset such as feature engineering opportunities, data cleansing steps, or additional data that could be collected.`;
      break;
      
    case 'insights':
      systemPrompt += ` Extract meaningful business insights and patterns from the data.`;
      userPrompt += `\nExtract key insights that would be valuable from a business perspective. Focus on trends, patterns, and actionable observations.`;
      break;
  }
  
  // Add any advanced options to the prompt
  if (advancedOptions) {
    userPrompt += `\nConsider these additional specifications: ${JSON.stringify(advancedOptions)}`;
  }
  
  return {
    system: systemPrompt,
    user: userPrompt
  };
};

// Function to generate follow-up questions based on initial analysis
export const generateFollowUpQuestions = async (
  initialAnalysis: string,
  datasetSummary: string,
  apiKey: string | null
) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const systemPrompt = `You are a data analysis assistant helping to explore a dataset further. 
  Based on the initial analysis, suggest 3-5 specific follow-up questions that would provide additional valuable insights.
  The questions should be diverse, specific, and directly actionable for further analysis.`;

  const userPrompt = `Initial analysis: ${initialAnalysis}
  
  Dataset summary: ${datasetSummary}
  
  Generate 3-5 follow-up questions that would provide deeper insights into this dataset. 
  Format them as a numbered list.`;

  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    } else {
      throw new Error('No response received from AI service');
    }
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    throw error;
  }
};

// Function to suggest data cleaning operations based on dataset analysis
export const suggestDataCleaning = async (
  data: object[],
  analysisResults: string,
  apiKey: string | null,
  options?: Record<string, any>
) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Sample the data if it's too large
  const sampledData = data.length > 30 ? sampleData(data, 30) : data;
  const dataString = JSON.stringify(sampledData);

  const systemPrompt = `You are a data cleaning specialist. Based on the dataset and its analysis, suggest specific data cleaning operations that would improve data quality.
  Focus on practical, implementable steps like handling missing values, standardizing formats, removing duplicates, correcting errors, or handling outliers.`;

  const userPrompt = `Dataset sample: ${dataString}
  
  Analysis results: ${analysisResults}
  
  ${options ? `Additional context: ${JSON.stringify(options)}` : ''}
  
  Suggest specific data cleaning operations for this dataset. For each suggestion:
  1. Describe the issue to address
  2. Recommend a specific cleaning approach
  3. Explain the expected improvement after cleaning
  
  Provide your suggestions in a clear, structured format.`;

  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    } else {
      throw new Error('No response received from AI service');
    }
  } catch (error) {
    console.error('Error suggesting data cleaning operations:', error);
    throw error;
  }
};
