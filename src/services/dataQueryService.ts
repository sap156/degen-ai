
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
  
  // We're not showing mock results anymore when no database is connected
  // Just leave the results field empty
  
  // Create the user prompt with the query and explanation of what we want
  const userPrompt = getUserPromptForMode(mode, query);
  
  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  try {
    // Get the model from localStorage
    const model = localStorage.getItem('openai-model') || 'gpt-3.5-turbo';
    
    // Call the OpenAI API
    const response = await getCompletion(apiKey, messages, {
      model,
      temperature: 0.3,
      max_tokens: 2000
    });
    
    // Parse the response (expecting JSON format)
    try {
      const result = JSON.parse(response) as QueryResult;
      
      // We no longer include mock results since there's no database connection
      // This will be implemented later when actual database connection is added
      
      return result;
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", e);
      console.log("Raw response:", response);
      
      // If parsing fails, return a fallback result with the raw response as SQL
      return {
        sql: response,
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
  const basePrompt = `You are SQLHelper, an expert SQL analyst and optimizer. Your goal is to help users work with databases effectively.`;
  
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
        
Your task is to optimize a SQL query to make it more efficient and performant.
${schemaContext}

Follow these rules:
1. Identify inefficient patterns in the query (nested subqueries, improper indexing, etc.)
2. Rewrite the query for better performance, explaining your optimizations
3. Suggest indexes or schema changes that would improve performance
4. Return your response as a JSON object with the following fields:
   - sql: The original SQL query
   - optimizedSql: The optimized version of the query
   - optimizations: List of specific optimizations made
   - indexSuggestions: Suggested indexes to improve query performance

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    case 'analyze':
      return `${basePrompt}
        
Your task is to analyze what this SQL query would return and provide insights.
${schemaContext}

Follow these rules:
1. Examine the query to identify what it's trying to achieve
2. Explain what kind of data it would retrieve
3. Format analysis in a clear, human-readable way with bullet points
4. Return your response as a JSON object with the following fields:
   - sql: The SQL query being analyzed
   - analysis: HTML-formatted analysis explaining what the query does
   - keyMetrics: Important metrics or statistics this query would retrieve

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    case 'followup':
      return `${basePrompt}
        
Your task is to suggest follow-up queries based on an initial query.
${schemaContext}

Follow these rules:
1. Analyze the initial query to identify logical next questions
2. Suggest 3-5 follow-up queries that would provide deeper insights
3. Make sure suggestions are relevant to the business context of the original query
4. Return your response as a JSON object with the following fields:
   - sql: The original SQL query
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
      return `Given this SQL query, please optimize it for better performance:
      
\`\`\`sql
SELECT 
  c.customer_name, 
  COUNT(o.order_id) as total_orders,
  SUM(o.order_total) as revenue
FROM 
  customers c
JOIN 
  (SELECT * FROM orders WHERE order_date >= '2023-01-01') o
ON 
  c.customer_id = o.customer_id
WHERE 
  c.status = 'active'
GROUP BY 
  c.customer_name
HAVING 
  COUNT(o.order_id) > 5
ORDER BY 
  revenue DESC
LIMIT 10;
\`\`\``;
      
    case 'analyze':
      return `Analyze this SQL query:
      
\`\`\`sql
SELECT 
  category_name,
  COUNT(product_id) as product_count,
  ROUND(AVG(unit_price), 2) as avg_price,
  MIN(unit_price) as min_price,
  MAX(unit_price) as max_price,
  SUM(units_in_stock) as total_stock
FROM 
  products p
JOIN 
  categories c ON p.category_id = c.category_id
GROUP BY 
  category_name
ORDER BY 
  product_count DESC;
\`\`\``;
      
    case 'followup':
      return `Based on this query, suggest meaningful follow-up questions for deeper analysis:
      
Original Question: "${query}"

SQL Query:
\`\`\`sql
SELECT 
  customer_name,
  COUNT(order_id) as order_count,
  SUM(order_total) as total_revenue
FROM 
  customers c
JOIN 
  orders o ON c.customer_id = o.customer_id
WHERE 
  order_date BETWEEN '2023-01-01' AND '2023-03-31'
GROUP BY 
  customer_name
ORDER BY 
  total_revenue DESC
LIMIT 10;
\`\`\``;
      
    default:
      return query;
  }
};

// We no longer need the generateMockResults function since we're not showing mock results
