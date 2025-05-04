
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

    // In a real implementation, we would call the Python script directly
    // For this demo, we'll simulate the response with a mock implementation
    console.log(`Attempting to scrape ${url} with selector ${cssSelector || 'body'}`);
    
    // Simulate the Python script execution
    // In production, you would replace this with actual Python script execution
    const result = await simulateScraping(url, cssSelector || 'body');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: result,
        metadata: {
          url,
          cssSelector: cssSelector || 'body',
          timestamp: new Date().toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in web scraping function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Simulate web scraping function
// In production, this would be replaced with actual Python script execution
async function simulateScraping(url: string, cssSelector: string): Promise<string> {
  try {
    // This is where you would call the Python script in production
    // const command = await exec(`python scrape_tool_runner.py "${url}" "${cssSelector}"`);
    // return command.output;

    // For this demo, we'll return a simulated response
    if (url.includes('wikipedia')) {
      return `Content extracted from Wikipedia using selector '${cssSelector}':\n\nWikipedia is a free online encyclopedia, created and edited by volunteers around the world and hosted by the Wikimedia Foundation.`;
    } else if (url.includes('github')) {
      return `Content extracted from GitHub using selector '${cssSelector}':\n\nGitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage your Git repositories, review code, and more.`;
    } else {
      return `Content extracted from ${url} using selector '${cssSelector}':\n\nThis is simulated content from the webpage. In a production environment, this would be the actual content scraped from the website using CrewAI's ScrapeElementFromWebsiteTool.`;
    }
  } catch (error) {
    console.error("Error simulating web scraping:", error);
    throw new Error(`Failed to scrape content: ${error.message}`);
  }
}
