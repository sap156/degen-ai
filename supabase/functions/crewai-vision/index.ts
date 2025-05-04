
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
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const imageUrl = formData.get("imageUrl") as string;
    
    if (!imageFile && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Either an image file or image URL is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing ${imageFile ? 'uploaded image' : 'image URL: ' + imageUrl}`);
    
    // Set up paths and commands
    const scriptPath = Deno.env.get('VISION_SCRIPT_PATH') || '/app/scripts/vision_tool_runner.py';
    const pythonPath = Deno.env.get('PYTHON_PATH') || 'python3';
    const tempDir = Deno.env.get('TEMP_DIR') || '/tmp';
    
    let imagePath;
    let command;
    
    if (imageFile) {
      // Save the uploaded file to a temporary location
      const buffer = await imageFile.arrayBuffer();
      const tempFilePath = `${tempDir}/upload_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      console.log(`Saving uploaded file to: ${tempFilePath}`);
      await Deno.writeFile(tempFilePath, new Uint8Array(buffer));
      
      imagePath = tempFilePath;
      command = `${pythonPath} ${scriptPath} "${imagePath}"`;
    } else {
      // Use the image URL
      imagePath = imageUrl;
      command = `${pythonPath} ${scriptPath} "${imagePath}"`;
    }
    
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
      
      // Clean up the temporary file if it was created
      if (imageFile) {
        try {
          await Deno.remove(imagePath);
          console.log(`Temporary file ${imagePath} removed`);
        } catch (removeError) {
          console.error(`Failed to remove temporary file: ${removeError.message}`);
        }
      }
    } catch (execError) {
      console.error("Error executing Python script:", execError);
      throw new Error(`Failed to execute script: ${execError.message}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: result,
        metadata: {
          source: imageFile ? imageFile.name : imageUrl,
          type: imageFile ? "upload" : "url",
          timestamp: new Date().toISOString(),
          executionMethod: 'CrewAI VisionTool'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in vision processing function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "There was an error running the CrewAI VisionTool. Make sure the Python environment is properly set up with the required dependencies."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
