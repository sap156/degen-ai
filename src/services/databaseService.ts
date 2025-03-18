
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

// Always return false for database connection - functionality disabled
export const isDatabaseConnected = (): boolean => {
  return false;
};

// Generate a unique ID for each database connection
const generateConnectionId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Check if the API endpoint exists
const checkApiEndpoint = async (endpoint: string): Promise<boolean> => {
  // Since functionality is disabled, always return false
  return false;
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

// Disabled database connection handling
export const connectToDatabase = async (
  apiKey: string | null,
  config: DatabaseConnectionConfig
): Promise<boolean> => {
  toast.error("Database connection feature is currently disabled");
  return false;
};

// Test PostgreSQL connection - disabled
const testPostgresConnection = async (config: DatabaseConnectionConfig): Promise<boolean> => {
  return false;
};

// Test MongoDB connection - disabled
const testMongoConnection = async (config: DatabaseConnectionConfig): Promise<boolean> => {
  return false;
};

// Test Snowflake connection - disabled
const testSnowflakeConnection = async (config: DatabaseConnectionConfig): Promise<boolean> => {
  return false;
};

// Load connections from localStorage on app initialization - disabled
export const loadSavedConnections = (): void => {
  databaseConnections = [];
  activeConnectionId = null;
};

// Initialize connections on module load
loadSavedConnections();

export const getConnectionConfig = (): DatabaseConnectionConfig | null => {
  return null;
};

export const getAllConnections = (): DatabaseConnectionConfig[] => {
  return [];
};

export const switchConnection = (connectionId: string): boolean => {
  return false;
};

export const disconnectDatabase = (connectionId?: string): void => {
  toast.info('Database connection feature is disabled');
};

export const getDatabases = async (apiKey: string | null): Promise<Database[]> => {
  return [];
};

export const getSchemas = async (apiKey: string | null, database: string): Promise<DatabaseSchema[]> => {
  return [];
};

export const getTables = async (
  apiKey: string | null, 
  database: string, 
  schema: string
): Promise<DatabaseTable[]> => {
  return [];
};

export const executeQuery = async (
  apiKey: string | null,
  query: string,
  database: string,
  schema?: string
): Promise<QueryResult> => {
  return { 
    columns: [], 
    rows: [], 
    error: "Database connection feature is currently disabled" 
  };
};
