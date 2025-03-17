
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
  
  // Create an example result for demonstration
  const exampleResults = generateMockResults(query);
  
  // Create the user prompt with the query and explanation of what we want
  const userPrompt = getUserPromptForMode(mode, query, exampleResults);
  
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
      
      // Include mock results for demonstration (in a real app, these would come from the database)
      if (!result.results) {
        result.results = exampleResults;
      }
      
      return result;
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", e);
      console.log("Raw response:", response);
      
      // If parsing fails, return a fallback result with the raw response as SQL
      return {
        sql: response,
        results: exampleResults,
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
        
Your task is to analyze SQL query results and provide meaningful insights.
${schemaContext}

Follow these rules:
1. Examine the query and sample results to identify key patterns and insights
2. Explain what the data reveals, highlighting noteworthy findings
3. Format analysis in a clear, human-readable way with bullet points
4. Return your response as a JSON object with the following fields:
   - sql: The SQL query being analyzed
   - analysis: HTML-formatted analysis with key insights, bullet points, and explanations
   - keyMetrics: Important metrics or statistics from the results

IMPORTANT: Only output valid JSON. Do not include markdown, code blocks, or any additional text.`;

    case 'followup':
      return `${basePrompt}
        
Your task is to suggest follow-up queries based on an initial query and its results.
${schemaContext}

Follow these rules:
1. Analyze the initial query and results to identify logical next questions
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
const getUserPromptForMode = (mode: ProcessingMode, query: string, exampleResults: any[]): string => {
  const resultsJson = JSON.stringify(exampleResults, null, 2);
  
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
      return `Analyze this SQL query and its results:
      
SQL Query:
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
\`\`\`

Sample Results:
${resultsJson}`;
      
    case 'followup':
      return `Based on this query and results, suggest meaningful follow-up questions for deeper analysis:
      
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
\`\`\`

Results:
${resultsJson}`;
      
    default:
      return query;
  }
};

// Helper function to generate mock results for demonstration
const generateMockResults = (query: string): any[] => {
  // Generate different mock data based on the query content
  if (query.toLowerCase().includes('customer') && query.toLowerCase().includes('revenue')) {
    return [
      { customer_name: "Acme Corporation", order_count: 24, total_revenue: 52430.50 },
      { customer_name: "Global Industries", order_count: 18, total_revenue: 38750.25 },
      { customer_name: "Tech Solutions Inc", order_count: 15, total_revenue: 32180.10 },
      { customer_name: "Bright Future LLC", order_count: 12, total_revenue: 28640.75 },
      { customer_name: "Modern Enterprises", order_count: 10, total_revenue: 25320.30 },
      { customer_name: "Prime Logistics", order_count: 9, total_revenue: 19850.60 },
      { customer_name: "Summit Partners", order_count: 8, total_revenue: 18750.90 },
      { customer_name: "Central Services", order_count: 7, total_revenue: 16430.25 },
      { customer_name: "Urban Solutions", order_count: 6, total_revenue: 14380.50 },
      { customer_name: "Star Systems", order_count: 5, total_revenue: 12750.75 }
    ];
  } else if (query.toLowerCase().includes('product') && query.toLowerCase().includes('inventory')) {
    return [
      { product_name: "Wireless Headphones", category: "Electronics", units_in_stock: 8, reorder_level: 10 },
      { product_name: "Smart Watch Model X", category: "Electronics", units_in_stock: 5, reorder_level: 10 },
      { product_name: "Office Chair Deluxe", category: "Furniture", units_in_stock: 12, reorder_level: 15 },
      { product_name: "Organic Green Tea", category: "Beverages", units_in_stock: 3, reorder_level: 25 },
      { product_name: "Ultra HD Monitor", category: "Electronics", units_in_stock: 7, reorder_level: 10 },
      { product_name: "Professional Blender", category: "Appliances", units_in_stock: 18, reorder_level: 20 },
      { product_name: "Wireless Keyboard", category: "Electronics", units_in_stock: 9, reorder_level: 15 },
      { product_name: "Ergonomic Mouse", category: "Electronics", units_in_stock: 14, reorder_level: 15 }
    ];
  } else if (query.toLowerCase().includes('sales') && query.toLowerCase().includes('region')) {
    return [
      { region: "North", current_year_sales: 1245300, previous_year_sales: 1150600, growth_percentage: 8.23 },
      { region: "South", current_year_sales: 980750, previous_year_sales: 950200, growth_percentage: 3.21 },
      { region: "East", current_year_sales: 1520400, previous_year_sales: 1380900, growth_percentage: 10.10 },
      { region: "West", current_year_sales: 1105000, previous_year_sales: 1205300, growth_percentage: -8.32 },
      { region: "Central", current_year_sales: 875600, previous_year_sales: 840100, growth_percentage: 4.23 }
    ];
  } else {
    // Default mockup data
    return [
      { id: 1, name: "Example 1", value: 100, date: "2023-04-15" },
      { id: 2, name: "Example 2", value: 200, date: "2023-04-16" },
      { id: 3, name: "Example 3", value: 150, date: "2023-04-17" },
      { id: 4, name: "Example 4", value: 300, date: "2023-04-18" },
      { id: 5, name: "Example 5", value: 250, date: "2023-04-19" }
    ];
  }
};
