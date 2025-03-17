
// Follow Deno's recommended practice for handling CORS
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface RequestBody {
  endpoint: string;
  payload: any;
  apiKey: string;
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://degen-ai.lovable.app',
  'https://gpqastfkpzbssmewvxqe.supabase.co'
];

// Function to handle CORS headers
const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
});

// Handle the request
serve(async (req) => {
  // Extract the request's origin
  const origin = req.headers.get('origin') || '';
  
  // Check if the origin is allowed
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  if (!isAllowedOrigin) {
    return new Response('Forbidden', { status: 403 });
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(origin),
      status: 204,
    });
  }

  try {
    // Parse the request body
    const { endpoint, payload, apiKey } = await req.json() as RequestBody;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate the endpoint - we'll focus on chat completions for now
    if (endpoint !== 'chat/completions') {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    }

    // Forward the request to OpenAI API
    const openAIResponse = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
    });

    // Read the response data
    const data = await openAIResponse.json();

    // Return the response from OpenAI
    return new Response(JSON.stringify(data), {
      status: openAIResponse.status,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
      },
    });
  }
});
