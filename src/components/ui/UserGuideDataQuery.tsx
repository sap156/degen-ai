
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Database, Code, TableProperties, Sparkles, BarChart3 } from 'lucide-react';

const UserGuideDataQuery = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Data Query User Guide
        </CardTitle>
        <CardDescription>
          Learn how to query, explore, and analyze your data using natural language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is Data Query?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Data Query is a service that allows you to interact with your data using natural language and AI-powered assistance.
                  This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Query your databases and datasets using plain English</li>
                  <li>Generate SQL, NoSQL, or API queries automatically</li>
                  <li>Explore and analyze data without writing complex code</li>
                  <li>Visualize query results with auto-generated charts</li>
                  <li>Get insights and answer business questions from your data</li>
                </ul>
                <p>
                  Data Query bridges the gap between complex data structures and business users, making data exploration accessible 
                  without requiring deep technical knowledge.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="key-features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Natural Language Queries</h4>
                    <p className="text-sm text-muted-foreground">
                      Ask questions about your data in plain English and get accurate results without writing code.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Code className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Query Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically convert natural language questions into optimized SQL, NoSQL, or API queries.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Multi-Database Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect to and query various database types including SQL, NoSQL, and API-based data sources.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Visualization</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate appropriate charts and visualizations based on query results.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <TableProperties className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Schema Understanding</h4>
                    <p className="text-sm text-muted-foreground">
                      AI-powered analysis of database schemas to understand relationships and optimize queries.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="how-to-use">
            <AccordionTrigger>How to Use</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Setting Up a Data Connection</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to the <strong>Connections</strong> tab</li>
                    <li>Click <strong>Add New Connection</strong></li>
                    <li>Select your database type:
                      <ul className="list-disc pl-6 mt-1">
                        <li>SQL (MySQL, PostgreSQL, SQLite, etc.)</li>
                        <li>NoSQL (MongoDB, Firestore, etc.)</li>
                        <li>API (REST, GraphQL)</li>
                        <li>File-based (CSV, JSON, Excel)</li>
                      </ul>
                    </li>
                    <li>Enter connection details (host, credentials, database name)</li>
                    <li>Test and save the connection</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Querying Your Data</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Select a data connection from your saved connections</li>
                    <li>Type your question in natural language in the query box</li>
                    <li>Examples:
                      <ul className="list-disc pl-6 mt-1">
                        <li>"Show me sales by region for the last quarter"</li>
                        <li>"Find customers who purchased more than $1000 last month"</li>
                        <li>"What's the average processing time for support tickets by priority?"</li>
                      </ul>
                    </li>
                    <li>Click <strong>Run Query</strong> or press Enter</li>
                    <li>Review the generated SQL/query and results</li>
                    <li>Refine your question if needed for more specific results</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Visualizing Results</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>After running a query, select the <strong>Visualization</strong> tab</li>
                    <li>Choose a chart type or use the auto-suggested visualization</li>
                    <li>Customize visualization settings:
                      <ul className="list-disc pl-6 mt-1">
                        <li>X and Y axis fields</li>
                        <li>Grouping and aggregation</li>
                        <li>Colors and labels</li>
                        <li>Display options</li>
                      </ul>
                    </li>
                    <li>Save or export the visualization</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger>Tips and Best Practices</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Be Specific:</strong> While natural language queries are powerful, being specific about what you're 
                    looking for yields more accurate results (e.g., "Show sales by region for Q2 2023" is better than "Show sales data").
                  </li>
                  <li>
                    <strong>Schema Upload:</strong> For better query accuracy, upload a complete schema or data dictionary if 
                    available, especially if your database has complex relationships.
                  </li>
                  <li>
                    <strong>Query History:</strong> Use the query history feature to revisit and refine previous queries rather 
                    than starting from scratch each time.
                  </li>
                  <li>
                    <strong>Review Generated SQL:</strong> Always review the automatically generated queries to understand what's 
                    happening and make adjustments if needed.
                  </li>
                  <li>
                    <strong>Context Building:</strong> Start with simpler queries and gradually build context by asking related 
                    follow-up questions for more complex analyses.
                  </li>
                  <li>
                    <strong>Save Common Queries:</strong> Save frequently used queries as templates that can be easily modified 
                    for similar future analyses.
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="use-cases">
            <AccordionTrigger>Common Use Cases</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Business Intelligence</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable non-technical business users to explore data and generate insights without relying on data analysts.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Exploration</h4>
                  <p className="text-sm text-muted-foreground">
                    Quickly investigate new datasets to understand patterns, distributions, and relationships.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Ad-hoc Reporting</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate custom reports and answer specific business questions without pre-built report templates.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Dashboard Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    Quickly prototype and build data visualizations for dashboards and presentations.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Database Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore and understand the structure of unfamiliar databases more easily through natural language interaction.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataQuery;
