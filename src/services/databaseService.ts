
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
      // Store connection info for future use
      localStorage.setItem('database-connection', JSON.stringify(config));
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
      },
      body: JSON.stringify(config),
    });
    
    const result = await response.json();
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
      },
      body: JSON.stringify(config),
    });
    
    const result = await response.json();
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
      },
      body: JSON.stringify(config),
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to connect to Snowflake database");
    }
    
    return true;
  } catch (error) {
    console.error("Snowflake connection test failed:", error);
    throw error;
  }
};

export const isDatabaseConnected = (): boolean => {
  return localStorage.getItem('database-connection') !== null;
};

export const getConnectionConfig = (): DatabaseConnectionConfig | null => {
  const config = localStorage.getItem('database-connection');
  return config ? JSON.parse(config) : null;
};

export const disconnectDatabase = (): void => {
  localStorage.removeItem('database-connection');
  toast.success('Database disconnected');
};

export const getDatabases = async (apiKey: string | null): Promise<Database[]> => {
  if (!apiKey || !isDatabaseConnected()) {
    return [];
  }

  try {
    const config = getConnectionConfig();
    
    // Call the real API endpoint to get databases
    const response = await fetch('/api/get-databases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching databases: ${response.statusText}`);
    }
    
    const result = await response.json();
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
    
    // Call the real API endpoint to get schemas
    const response = await fetch('/api/get-schemas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, database }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching schemas: ${response.statusText}`);
    }
    
    const result = await response.json();
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
    
    // Call the real API endpoint to get tables
    const response = await fetch('/api/get-tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, database, schema }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching tables: ${response.statusText}`);
    }
    
    const result = await response.json();
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
    
    // Call the real API endpoint to execute the query
    const response = await fetch('/api/execute-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config, query, database, schema }),
    });
    
    if (!response.ok) {
      throw new Error(`Error executing query: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error executing query:", error);
    return { 
      columns: [], 
      rows: [], 
      error: `Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};
