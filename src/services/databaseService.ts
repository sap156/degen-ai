
import { toast } from "sonner";

export interface DatabaseConnectionConfig {
  type: 'mongodb' | 'postgresql' | 'snowflake';
  host: string;
  port?: string;
  database?: string;
  username: string;
  password: string;
  connectionString?: string;
  schema?: string;
  useConnectionString?: boolean;
  ssl?: boolean;
  id?: string; // Unique identifier for the connection
}

export interface DatabaseTable {
  name: string;
  schema?: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable?: boolean;
  isPrimary?: boolean;
}

export interface Database {
  name: string;
}

export interface DatabaseSchema {
  name: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  error?: string;
  message?: string;
}

// Storage for multiple database connections
let databaseConnections: DatabaseConnectionConfig[] = [];
let activeConnectionId: string | null = null;

// Generate a unique ID for each database connection
const generateConnectionId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Check if the API endpoint exists
const checkApiEndpoint = async (endpoint: string): Promise<boolean> => {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Just check if the endpoint responds, don't parse the response
    return response.ok;
  } catch (error) {
    console.error(`API endpoint ${endpoint} not available:`, error);
    return false;
  }
};

// Detect if a response is HTML instead of JSON
const isHtmlResponse = (text: string): boolean => {
  return text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE');
};

// Safe JSON parsing function with HTML detection
const safeParseJSON = async (response: Response): Promise<any> => {
  try {
    // First check if the response is empty
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    
    // Check if the response is HTML (common for error pages)
    if (isHtmlResponse(text)) {
      throw new Error("Received HTML response instead of JSON. The API endpoint may be returning an error page.");
    }
    
    // Then try to parse it
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON parsing error:", error);
    
    // Provide a more specific error message
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON response: ${error.message}`);
    } else if (error instanceof Error && error.message.includes('HTML')) {
      throw error; // Pass through the HTML detection error
    } else {
      throw new Error(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Real database connection handling
export const connectToDatabase = async (
  apiKey: string | null,
  config: DatabaseConnectionConfig
): Promise<boolean> => {
  if (!apiKey) {
    toast.error("OpenAI API key is required");
    return false;
  }

  try {
    // Validate connection parameters
    if (!config.host && !config.connectionString) {
      throw new Error("Host or connection string is required");
    }
    
    if (!config.useConnectionString && (!config.username || !config.password)) {
      throw new Error("Username and password are required");
    }
    
    // Check if API endpoints are available before trying to connect
    const endpoints = {
      postgresql: '/api/test-postgres-connection',
      mongodb: '/api/test-mongo-connection',
      snowflake: '/api/test-snowflake-connection'
    };
    
    const endpointExists = await checkApiEndpoint(endpoints[config.type]);
    
    if (!endpointExists) {
      toast.error(`Backend API for ${config.type} connections is not available`);
      return false;
    }
    
    // Attempt real database connection based on type
    let connectionSuccessful = false;
    
    if (config.type === 'postgresql') {
      connectionSuccessful = await testPostgresConnection(config);
    } else if (config.type === 'mongodb') {
      connectionSuccessful = await testMongoConnection(config);
    } else if (config.type === 'snowflake') {
      connectionSuccessful = await testSnowflakeConnection(config);
    }
    
    if (connectionSuccessful) {
      // Generate a unique ID for this connection
      const connectionId = generateConnectionId();
      
      // Store connection info for future use
      const connectionConfig = {
        ...config,
        id: connectionId
      };
      
      // Add to the connections array
      databaseConnections.push(connectionConfig);
      
      // Set as active connection
      activeConnectionId = connectionId;
      
      // Store all connections in localStorage
      localStorage.setItem('database-connections', JSON.stringify(databaseConnections));
      localStorage.setItem('active-connection-id', connectionId);
      
      return true;
    } else {
      throw new Error("Failed to establish database connection");
    }
  } catch (error) {
    console.error("Database connection error:", error);
    toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Test PostgreSQL connection
const testPostgresConnection = async (config: DatabaseConnectionConfig): Promise<boolean> => {
  try {
    const response = await fetch('/api/test-postgres-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (isHtmlResponse(errorText)) {
        throw new Error("Server returned an HTML error page instead of JSON response");
      }
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    const result = await safeParseJSON(response);
    if (!result.success) {
      throw new Error(result.error || "Failed to connect to PostgreSQL database");
    }
    
    return true;
  } catch (error) {
    console.error("PostgreSQL connection test failed:", error);
    throw error;
  }
};

// Test MongoDB connection
const testMongoConnection = async (config: DatabaseConnectionConfig): Promise<boolean> => {
  try {
    const response = await fetch('/api/test-mongo-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (isHtmlResponse(errorText)) {
        throw new Error("Server returned an HTML error page instead of JSON response");
      }
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    const result = await safeParseJSON(response);
    if (!result.success) {
      throw new Error(result.error || "Failed to connect to MongoDB database");
    }
    
    return true;
  } catch (error) {
    console.error("MongoDB connection test failed:", error);
    throw error;
  }
};

// Test Snowflake connection
const testSnowflakeConnection = async (config: DatabaseConnectionConfig): Promise<boolean> => {
  try {
    const response = await fetch('/api/test-snowflake-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (isHtmlResponse(errorText)) {
        throw new Error("Server returned an HTML error page instead of JSON response");
      }
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    const result = await safeParseJSON(response);
    if (!result.success) {
      throw new Error(result.error || "Failed to connect to Snowflake database");
    }
    
    return true;
  } catch (error) {
    console.error("Snowflake connection test failed:", error);
    throw error;
  }
};

// Load connections from localStorage on app initialization
export const loadSavedConnections = (): void => {
  try {
    const connectionsJson = localStorage.getItem('database-connections');
    const activeId = localStorage.getItem('active-connection-id');
    
    if (connectionsJson) {
      databaseConnections = JSON.parse(connectionsJson);
    }
    
    if (activeId) {
      activeConnectionId = activeId;
    }
  } catch (error) {
    console.error("Error loading saved connections:", error);
    databaseConnections = [];
    activeConnectionId = null;
  }
};

// Initialize connections on module load
loadSavedConnections();

export const isDatabaseConnected = (): boolean => {
  return databaseConnections.length > 0 && activeConnectionId !== null;
};

export const getConnectionConfig = (): DatabaseConnectionConfig | null => {
  if (!activeConnectionId) return null;
  
  const activeConnection = databaseConnections.find(conn => conn.id === activeConnectionId);
  return activeConnection || null;
};

export const getAllConnections = (): DatabaseConnectionConfig[] => {
  return databaseConnections;
};

export const switchConnection = (connectionId: string): boolean => {
  const connectionExists = databaseConnections.some(conn => conn.id === connectionId);
  
  if (connectionExists) {
    activeConnectionId = connectionId;
    localStorage.setItem('active-connection-id', connectionId);
    toast.success('Switched to different database connection');
    return true;
  }
  
  return false;
};

export const disconnectDatabase = (connectionId?: string): void => {
  if (connectionId) {
    // Remove specific connection
    databaseConnections = databaseConnections.filter(conn => conn.id !== connectionId);
    
    // If we removed the active connection, set a new active connection or null
    if (activeConnectionId === connectionId) {
      activeConnectionId = databaseConnections.length > 0 ? databaseConnections[0].id : null;
    }
  } else {
    // Remove active connection only
    if (activeConnectionId) {
      databaseConnections = databaseConnections.filter(conn => conn.id !== activeConnectionId);
      activeConnectionId = databaseConnections.length > 0 ? databaseConnections[0].id : null;
    }
  }
  
  // Update localStorage
  localStorage.setItem('database-connections', JSON.stringify(databaseConnections));
  if (activeConnectionId) {
    localStorage.setItem('active-connection-id', activeConnectionId);
  } else {
    localStorage.removeItem('active-connection-id');
  }
  
  toast.success('Database disconnected');
};

export const getDatabases = async (apiKey: string | null): Promise<Database[]> => {
  if (!apiKey || !isDatabaseConnected()) {
    return [];
  }

  try {
    const config = getConnectionConfig();
    
    // Check if the API endpoint exists before calling it
    const endpointExists = await checkApiEndpoint('/api/get-databases');
    if (!endpointExists) {
      toast.error('Backend API for database listing is not available');
      return [];
    }
    
    // Call the real API endpoint to get databases
    const response = await fetch('/api/get-databases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    const result = await safeParseJSON(response);
    return result.databases;
  } catch (error) {
    console.error("Error fetching databases:", error);
    toast.error(`Failed to fetch databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

export const getSchemas = async (apiKey: string | null, database: string): Promise<DatabaseSchema[]> => {
  if (!apiKey || !isDatabaseConnected()) {
    return [];
  }

  try {
    const config = getConnectionConfig();
    
    // Check if the API endpoint exists before calling it
    const endpointExists = await checkApiEndpoint('/api/get-schemas');
    if (!endpointExists) {
      toast.error('Backend API for schema listing is not available');
      return [];
    }
    
    // Call the real API endpoint to get schemas
    const response = await fetch('/api/get-schemas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, database }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    const result = await safeParseJSON(response);
    return result.schemas;
  } catch (error) {
    console.error("Error fetching schemas:", error);
    toast.error(`Failed to fetch schemas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

export const getTables = async (
  apiKey: string | null, 
  database: string, 
  schema: string
): Promise<DatabaseTable[]> => {
  if (!apiKey || !isDatabaseConnected()) {
    return [];
  }

  try {
    const config = getConnectionConfig();
    
    // Check if the API endpoint exists before calling it
    const endpointExists = await checkApiEndpoint('/api/get-tables');
    if (!endpointExists) {
      toast.error('Backend API for table listing is not available');
      return [];
    }
    
    // Call the real API endpoint to get tables
    const response = await fetch('/api/get-tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, database, schema }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    const result = await safeParseJSON(response);
    return result.tables;
  } catch (error) {
    console.error("Error fetching tables:", error);
    toast.error(`Failed to fetch tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

export const executeQuery = async (
  apiKey: string | null,
  query: string,
  database: string,
  schema?: string
): Promise<QueryResult> => {
  if (!apiKey || !isDatabaseConnected()) {
    return { columns: [], rows: [], error: "Not connected to a database" };
  }

  try {
    const config = getConnectionConfig();
    
    // Check if the API endpoint exists before calling it
    const endpointExists = await checkApiEndpoint('/api/execute-query');
    if (!endpointExists) {
      return { 
        columns: [], 
        rows: [], 
        error: "Backend API for query execution is not available" 
      };
    }
    
    // Call the real API endpoint to execute the query
    const response = await fetch('/api/execute-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, query, database, schema }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error ${response.status}`);
    }
    
    return await safeParseJSON(response);
  } catch (error) {
    console.error("Error executing query:", error);
    return { 
      columns: [], 
      rows: [], 
      error: `Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};
