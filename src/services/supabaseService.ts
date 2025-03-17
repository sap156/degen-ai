import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types for our Supabase database tables
export interface Dataset {
  id: string;
  name: string;
  schema: Record<string, any>;
  created_at: string;
  user_id: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  sql: string;
  results: any;
  created_at: string;
  user_id: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  // Use the specific project credentials
  private supabaseUrl: string = 'https://sbp_c08f1c0fb1c423dcb3be206bd5cd701525f819ba.supabase.co';
  private supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImM3Z204ODVidnhpY3Zwc25laHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MDQ5OTEsImV4cCI6MjA1Mjk4MDk5MX0.CtcJa0PicDIJzE4K7FdXcvH9eVXfKPTjfGTVkWUbYGo';
  
  constructor() {
    this.initClient();
  }

  private initClient() {
    if (!this.client && this.supabaseUrl && this.supabaseKey) {
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      this.initClient();
      if (!this.client) {
        throw new Error('Supabase client not initialized');
      }
    }
    return this.client;
  }

  // Data Query Service methods
  async saveQueryHistory(query: string, sql: string, results: any, userId: string): Promise<void> {
    const client = this.getClient();
    await client.from('query_history').insert({
      query,
      sql,
      results,
      user_id: userId
    });
  }

  async getQueryHistory(userId: string): Promise<QueryHistory[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('query_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  // Synthetic Data Service methods
  async saveDataset(name: string, schema: Record<string, any>, userId: string): Promise<string> {
    const client = this.getClient();
    const { data, error } = await client
      .from('datasets')
      .insert({
        name,
        schema,
        user_id: userId
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  }

  async getDatasets(userId: string): Promise<Dataset[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  }

  // Forward OpenAI requests through Supabase Edge Functions
  async callOpenAI(endpoint: string, payload: any, apiKey: string): Promise<any> {
    const client = this.getClient();
    const { data, error } = await client.functions.invoke('openai-proxy', {
      body: {
        endpoint,
        payload,
        apiKey
      }
    });
    
    if (error) throw error;
    return data;
  }
}

// Create a singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;
