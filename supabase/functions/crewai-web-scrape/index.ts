
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { exec } from "https://deno.land/x/exec@0.0.5/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, cssSelector } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Executing CrewAI ScrapeElementFromWebsiteTool for URL: ${url} with selector: ${cssSelector || 'body'}`);
    
    // Execute the Python script
    const scriptPath = Deno.env.get('SCRIPT_PATH') || '/app/scripts/scrape_tool_runner.py';
    const pythonPath = Deno.env.get('PYTHON_PATH') || 'python3';
    const command = `${pythonPath} ${scriptPath} "${url}" "${cssSelector || 'body'}"`;
    
    console.log(`Executing command: ${command}`);
    
    let result;
    try {
      // Execute the Python script
      const { stdout, stderr } = await exec(command);
      
      if (stderr) {
        console.error("Script stderr:", stderr);
      }
      
      result = stdout.trim();
      console.log("Script execution successful");
    } catch (execError) {
      console.error("Error executing Python script:", execError);
      throw new Error(`Failed to execute script: ${execError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: result,
        metadata: {
          url,
          cssSelector: cssSelector || 'body',
          timestamp: new Date().toISOString(),
          executionMethod: 'CrewAI ScrapeElementFromWebsiteTool'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in web scraping function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "There was an error running the CrewAI ScrapeElementFromWebsiteTool. Make sure the Python environment is properly set up with the required dependencies."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
