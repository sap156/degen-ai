
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useApiKey } from '@/contexts/ApiKeyContext';

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
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    // We'll get these from environment variables in Supabase
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.initClient();
    }
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
