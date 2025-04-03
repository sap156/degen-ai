
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SnowflakeCredentials {
  account: string;
  username: string;
  password: string;
  database: string;
  schema: string;
  warehouse: string;
}

interface RequestPayload {
  sql: string;
  credentials: SnowflakeCredentials;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const payload: RequestPayload = await req.json();
    
    // Validate required fields
    if (!payload.sql) {
      return new Response(
        JSON.stringify({ error: 'SQL query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.credentials) {
      return new Response(
        JSON.stringify({ error: 'Snowflake credentials are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { account, username, password, database, schema, warehouse } = payload.credentials;
    
    // Validate all credential fields
    if (!account || !username || !password || !database || !schema || !warehouse) {
      return new Response(
        JSON.stringify({ error: 'All Snowflake credential fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Executing Snowflake query using account: ${account}`);
    
    // Prepare Snowflake API request
    const snowflakeUrl = `https://${account}.snowflakecomputing.com/api/v2/statements`;

    // Prepare the authorization header using base64-encoded credentials
    const credentials = btoa(`${username}:${password}`);
    
    // Prepare the request body with the SQL statement and parameters
    const requestBody = JSON.stringify({
      statement: payload.sql,
      timeout: 60,
      database: database,
      schema: schema,
      warehouse: warehouse,
      role: 'ACCOUNTADMIN' // Using default role
    });

    console.log('Sending request to Snowflake API...');
    
    // Execute the request to the Snowflake API
    const response = await fetch(snowflakeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'X-Snowflake-Authorization-Token-Type': 'BASIC'
      },
      body: requestBody
    });

    console.log(`Snowflake API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Snowflake API Error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Error executing Snowflake query',
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and return the Snowflake API response
    const result = await response.json();
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
