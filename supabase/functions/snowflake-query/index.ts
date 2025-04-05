
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

// Function to thoroughly clean Snowflake account identifier
const cleanSnowflakeAccountId = (accountId: string): string => {
  if (!accountId) return '';
  
  // Remove protocol if present
  let cleaned = accountId.replace(/^https?:\/\//, '');
  
  // Remove .snowflakecomputing.com and any trailing path/query if present
  cleaned = cleaned.replace(/\.snowflakecomputing\.com.*$/, '');
  
  return cleaned;
};

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

    // Ensure the account is properly cleaned
    const cleanAccount = cleanSnowflakeAccountId(account);
    console.log(`Authenticating with Snowflake account: ${cleanAccount}`);
    
    // Step 1: Authenticate with Snowflake to get a session token
    const loginUrl = `https://${cleanAccount}.snowflakecomputing.com/session/v1/login-request`;
    
    const loginPayload = JSON.stringify({
      data: {
        ACCOUNT_NAME: cleanAccount,
        LOGIN_NAME: username,
        PASSWORD: password,
      }
    });

    console.log('Sending authentication request to Snowflake...');
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: loginPayload
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Snowflake Authentication Error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with Snowflake',
          details: errorText
        }),
        { status: loginResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const loginResult = await loginResponse.json();
    const token = loginResult.data?.token;
    const masterToken = loginResult.data?.masterToken;
    
    if (!token || !masterToken) {
      console.error('No token or masterToken received from Snowflake');
      return new Response(
        JSON.stringify({ 
          error: 'No authentication tokens received from Snowflake',
          details: 'The login was successful but token or masterToken was not returned'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Successfully authenticated with Snowflake');
    
    // Step 2: Execute the SQL query using the token
    const queryUrl = `https://${cleanAccount}.snowflakecomputing.com/api/v2/statements`;
    
    const queryPayload = JSON.stringify({
      statement: payload.sql,
      timeout: 60,
      database: database,
      schema: schema,
      warehouse: warehouse,
      role: 'ACCOUNTADMIN' // Using default role
    });
    
    console.log('Sending SQL query to Snowflake API...');
    
    const queryResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Snowflake Token="${token}", MasterToken="${masterToken}"`
      },
      body: queryPayload
    });
    
    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      console.error('Snowflake Query Error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Error executing Snowflake query',
          details: errorText
        }),
        { status: queryResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse and return the Snowflake API response
    const queryResult = await queryResponse.json();
    
    return new Response(
      JSON.stringify(queryResult),
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
