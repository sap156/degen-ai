
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";
import { ProcessingMode, QueryResult } from "@/pages/DataQuery";

/**
 * Process a natural language query with AI to generate SQL, analyze, or optimize
 */
export const processQueryWithAI = async (
  apiKey: string | null,
  query: string,
  mode: ProcessingMode,
  schema?: string
): Promise<QueryResult> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  // Create system prompt based on the processing mode
  const systemPrompt = getSystemPromptForMode(mode, schema);
  
  // Create the user prompt with the query and explanation of what we want
  const userPrompt = getUserPromptForMode(mode, query);
  
  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    // Get the model from localStorage
    const model = localStorage.getItem('openai-model') || 'gpt-4o';
    
    // Call the OpenAI API
    const response = await getCompletion(apiKey, messages, {
      model: localStorage.getItem('openai-model') || 'gpt-4o',
      temperature: 0.3,
      max_tokens: 16384
    });
    
    // Parse the response (expecting JSON format)
    try {
      const result = JSON.parse(response) as QueryResult;
      
      // Make sure the original query is always included
      if (mode === 'optimize' || mode === 'analyze' || mode === 'followup') {
        result.sql = query;
      }
      
      return result;
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", e);
      console.log("Raw response:", response);
      
      // If parsing fails, return a fallback result with the raw response as SQL
      return {
        sql: mode === 'generate' ? response : query,
        error: "Failed to parse response properly"
      };
    }
  } catch (error) {
    console.error("Error processing query with AI:", error);
    throw error;
  }
};

// Helper function to get the appropriate system prompt based on processing mode
const getSystemPromptForMode = (mode: ProcessingMode, schema?: string): string => {
  const basePrompt = `You are SQLHelper, an expert SQL analyst and optimizer. Your goal is to help users work with databases effectively.
  - You can generate SQL queries from natural language, optimize existing queries, analyze complex queries, or suggest follow-up questions.
  - Provide clear, concise, and accurate SQL solutions to the user's queries.
  - Use your expertise to improve query performance and provide valuable insights.
  - Remember to consider the schema information provided for context.
  - Avoid jargon and technical terms that the user might not understand.
  - Focus on delivering high-quality SQL solutions that are efficient and effective.
  - Always keep the user's needs and the business context in mind.
  - If you need more information, ask the user for clarification.
  - If you encounter any issues, errors, or ambiguities, report them to the user.
  - Your responses should be professional, helpful, and easy to understand.`;
  
  const schemaContext = schema ? 
    `\n\nYou have access to the following schema information:\n${schema}` : 
    `\n\nNo schema information was provided. Make reasonable assumptions about table and column names.`;
  
  switch (mode) {
    case 'generate':
      return `${basePrompt}
        
Your task is to convert natural language queries into precise SQL statements.
${schemaContext}

Follow these rules:
1. Generate SQL that is accurate and efficient
2. Use standard SQL syntax compatible with most database systems
3. Make reasonable assumptions about table/column names if not in the schema
4. Return your response as a JSON object with the following fields:
   - sql: The generated SQL query
   - explanation: Brief explanation of what the query does
   - assumptions: Any assumptions you made about the schema

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    case 'optimize':
      return `${basePrompt}
        
Your task is to optimize the SQL query provided by the user to make it more efficient and performant.
${schemaContext}

Follow these rules:
1. Carefully examine the provided SQL query
2. If the query is already optimized, state that it's already well-optimized and explain why
3. Otherwise, identify inefficient patterns in the query (nested subqueries, improper indexing, etc.)
4. Rewrite the query for better performance, explaining your optimizations
5. Suggest indexes or schema changes that would improve performance
6. Return your response as a JSON object with the following fields:
   - sql: Leave empty as we'll keep the original query
   - optimizedSql: The optimized version of the query (or null if already optimized)
   - optimizations: List of specific optimizations made (or why the query is already optimal)
   - indexSuggestions: Suggested indexes to improve query performance

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    case 'analyze':
      return `${basePrompt}
        
Your task is to analyze the SQL query provided by the user and explain what it does.
${schemaContext}

Follow these rules:
1. Examine the query to identify what it's trying to achieve
2. Break down the query clause by clause (SELECT, FROM, JOIN, WHERE, GROUP BY, etc.)
3. Explain what kind of data it would retrieve and how it's being transformed
4. Identify potential performance issues or improvements
5. Format analysis in a clear, human-readable way with bullet points
6. Return your response as a JSON object with the following fields:
   - sql: Leave empty as we'll keep the original query
   - analysis: HTML-formatted analysis explaining what the query does
   - keyMetrics: Important metrics or statistics this query would retrieve

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    case 'followup':
      return `${basePrompt}
        
Your task is to suggest follow-up queries based on the user's SQL query.
${schemaContext}

Follow these rules:
1. Analyze the query to identify logical next questions
2. Suggest 3-5 follow-up queries that would provide deeper insights
3. Make sure suggestions are relevant to the business context of the original query
4. Return your response as a JSON object with the following fields:
   - sql: Leave empty as we'll keep the original query
   - followUpQueries: Array of suggested follow-up questions in natural language
   - rationale: Brief explanation of why these follow-ups would be valuable

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    default:
      return basePrompt;
  }
};

// Helper function to get the user prompt based on processing mode
const getUserPromptForMode = (mode: ProcessingMode, query: string): string => {
  switch (mode) {
    case 'generate':
      return `Generate SQL for this query: "${query}"`;
    
    case 'optimize':
      // Check if the input is likely SQL (contains SELECT, FROM, etc.) or a natural language query
      const isSqlQuery = /SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER/i.test(query);
      
      if (isSqlQuery) {
        return `Given this SQL query, please optimize it for better performance or state that it's already well-optimized:
        
\`\`\`sql
${query}
\`\`\``;
      } else {
        return `First generate SQL for this query: "${query}", then optimize it for better performance.`;
      }
      
    case 'analyze':
      // Check if the input is likely SQL or a natural language query
      const isLikelySql = /SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER/i.test(query);
      
      if (isLikelySql) {
        return `Analyze this SQL query and explain in detail what it does, how it works, and any potential improvements:
        
\`\`\`sql
${query}
\`\`\``;
      } else {
        return `First generate SQL for this query: "${query}", then analyze what the query does and how it works.`;
      }
      
    case 'followup':
      // Check if the input is likely SQL or a natural language query
      const isSql = /SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER/i.test(query);
      
      if (isSql) {
        return `Based on this SQL query, suggest meaningful follow-up questions for deeper analysis:
        
\`\`\`sql
${query}
\`\`\``;
      } else {
        return `Based on this query: "${query}", suggest meaningful follow-up questions for deeper analysis.`;
      }
      
    default:
      return query;
  }
};
