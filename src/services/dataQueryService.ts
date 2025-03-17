
import { useSupabase } from "@/hooks/useSupabase";
import { OpenAiMessage } from "./openAiService";

export type ProcessingMode = 'generate' | 'optimize' | 'analyze' | 'followup';

export interface QueryResult {
  query: string;
  sql: string;
  optimizedSql?: string;
  analysis?: string;
  followUpQueries?: string[];
  results: any[];
}

export const processQueryWithAI = async (
  apiKey: string | null,
  query: string,
  mode: ProcessingMode,
  schema: string
): Promise<QueryResult> => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  try {
    const supabase = useSupabase().supabase;

    let systemPrompt = "";
    let userPrompt = "";
    
    // Define different prompts based on the mode
    switch (mode) {
      case 'generate':
        systemPrompt = `You are a SQL expert that converts natural language queries into SQL code. 
- Generate only valid SQL based on the schema provided
- Always include SELECT, FROM, and other required clauses
- Use common SQL syntax that works across most database engines
- Return ONLY the SQL query without any markdown formatting or explanations`;

        userPrompt = `Database Schema:
${schema}

Convert this question to SQL:
${query}`;
        break;
        
      case 'optimize':
        systemPrompt = `You are a SQL optimization expert. Your task is to optimize SQL queries for better performance.
- Look for inefficient patterns like SELECT *, unnecessary JOINs, missing indexes
- Suggest specific optimizations to improve query execution time
- Format the optimized query for readability
- Return a JSON with the optimized SQL and a brief explanation of the improvements`;

        userPrompt = `Optimize this SQL query:
${query}

Return a JSON response with:
- "optimizedSql": the optimized SQL query
- "explanation": brief explanation of the optimizations made`;
        break;
        
      case 'analyze':
        systemPrompt = `You are a SQL analysis expert. Your task is to analyze a SQL query and explain how it works.
- Break down the SQL query into logical components
- Explain the purpose and function of each part
- Highlight any potential issues or edge cases
- Format your analysis with HTML for proper display (use <p>, <ul>, <li>, <code>, etc.)
- Return a detailed, education-focused analysis`;

        userPrompt = `Analyze this SQL query:
${query}

Provide a detailed breakdown of how this query works.`;
        break;
        
      case 'followup':
        systemPrompt = `You are a SQL expert that suggests follow-up queries based on an initial query.
- Suggest 3-5 related SQL queries that a user might want to run next
- Focus on business insights that would complement the initial query
- Make each follow-up query distinct and valuable
- Return a JSON array containing just the natural language descriptions of the follow-up queries`;

        userPrompt = `Based on this SQL query:
${query}

Suggest 3-5 follow-up queries that would provide additional insights or related information.
Return ONLY a JSON array of strings, each being a natural language question (not SQL).`;
        break;
    }

    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // This is a mock response for now
    const mockResults = [
      { id: 1, name: 'Product A', price: 29.99, category: 'Electronics' },
      { id: 2, name: 'Product B', price: 49.99, category: 'Electronics' },
      { id: 3, name: 'Product C', price: 19.99, category: 'Books' }
    ];

    // Call OpenAI via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: {
        endpoint: 'chat/completions',
        payload: {
          model: localStorage.getItem('openai-model') || 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 1500,
          messages
        },
        apiKey
      }
    });

    if (error) {
      console.error("Error calling OpenAI via Supabase:", error);
      throw new Error(`Failed to process query: ${error.message}`);
    }

    // Process the response based on the mode
    let result: QueryResult = {
      query,
      sql: '',
      results: mockResults // Using mock results for now
    };

    if (mode === 'generate') {
      result.sql = data.choices[0].message.content.trim();
    } 
    else if (mode === 'optimize') {
      try {
        const response = JSON.parse(data.choices[0].message.content);
        result.sql = query; // Original SQL
        result.optimizedSql = response.optimizedSql;
        result.analysis = `<p><strong>Optimization Notes:</strong></p><p>${response.explanation}</p>`;
      } catch (e) {
        console.error("Failed to parse optimization response:", e);
        result.sql = query;
        result.optimizedSql = data.choices[0].message.content.trim();
      }
    } 
    else if (mode === 'analyze') {
      result.sql = query;
      result.analysis = data.choices[0].message.content.trim();
    } 
    else if (mode === 'followup') {
      result.sql = query;
      try {
        result.followUpQueries = JSON.parse(data.choices[0].message.content);
      } catch (e) {
        console.error("Failed to parse follow-up queries:", e);
        // Try to extract follow-ups from non-JSON response
        const content = data.choices[0].message.content.trim();
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        result.followUpQueries = lines.slice(0, 5); // Take up to 5 lines
      }
    }

    // In a real implementation, we would save this to the query_history table
    // For now, we'll just return the result
    return result;
  } catch (error) {
    console.error("Error processing query with AI:", error);
    throw error;
  }
};
