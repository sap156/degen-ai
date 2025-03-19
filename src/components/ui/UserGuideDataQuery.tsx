
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Database, Code, FileText, Wand2, Sparkles, GitMerge, Search, Info } from 'lucide-react';

const UserGuideDataQuery = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Data Query Guide
        </CardTitle>
        <CardDescription>
          Learn how to use the Data Query service effectively
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger className="text-md font-medium">Overview</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">What is Data Query?</h3>
                <p className="text-sm text-muted-foreground">
                  The Data Query service allows you to convert natural language queries into SQL code, analyze existing SQL queries,
                  and optimize them for better performance. It uses AI to understand your intent and generate appropriate SQL statements.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Natural language to SQL conversion</li>
                  <li>SQL query optimization with explanations</li>
                  <li>SQL query analysis and breakdown</li>
                  <li>Suggestion of follow-up queries</li>
                  <li>Database schema integration for better accuracy</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">When to Use This Service</h3>
                <p className="text-sm text-muted-foreground">
                  Use this service when:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>You need to create SQL queries but aren't familiar with SQL syntax</li>
                  <li>You want to optimize existing SQL queries for better performance</li>
                  <li>You need to understand complex SQL queries written by others</li>
                  <li>You're exploring a database and want to generate different query approaches</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="schema">
            <AccordionTrigger className="text-md font-medium">Database Schema</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Why Provide a Schema?</h3>
                <p className="text-sm text-muted-foreground">
                  Providing your database schema helps the AI generate more accurate SQL queries. Without a schema,
                  the AI has to make assumptions about your table and column names, which may lead to less accurate results.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Schema Format</h3>
                <p className="text-sm text-muted-foreground">
                  You can provide your schema in several formats:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li><strong>CREATE TABLE statements</strong> - SQL DDL statements defining your tables</li>
                  <li><strong>Table descriptions</strong> - Plain text describing tables and their columns</li>
                  <li><strong>JSON schema</strong> - Structured representation of your database tables</li>
                  <li><strong>Sample data</strong> - Example rows that illustrate your data structure</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Example Schema</h3>
                <div className="bg-muted p-3 rounded-md text-xs font-mono">
                  <pre>{`CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  signup_date DATE
);

CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  order_date DATE,
  total_amount DECIMAL(10,2),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);`}</pre>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This schema defines two tables with their columns and a relationship between them.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="query-types">
            <AccordionTrigger className="text-md font-medium">Query Types</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Generate SQL</h3>
                <p className="text-sm text-muted-foreground">
                  Converts natural language questions into SQL queries. For example, "Show me all customers who ordered more than $100 worth of products last month"
                  will be transformed into a proper SQL query with JOINs, WHERE clauses, and other necessary SQL syntax.
                </p>
                <div className="border rounded-md p-3 mt-2">
                  <h4 className="font-medium flex items-center text-sm">
                    <Code className="h-4 w-4 mr-1" />
                    Example
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Input: "Find customers who made purchases in both January and February"
                  </p>
                  <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
                    {`SELECT c.customer_id, c.name 
FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.customer_id = c.customer_id 
  AND MONTH(o.order_date) = 1
)
AND EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.customer_id = c.customer_id 
  AND MONTH(o.order_date) = 2
);`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Optimize SQL</h3>
                <p className="text-sm text-muted-foreground">
                  Takes an existing SQL query and suggests optimizations to improve performance. It identifies inefficient patterns
                  like nested subqueries, missing indexes, or improper JOIN conditions, and proposes more efficient alternatives.
                </p>
                <div className="border rounded-md p-3 mt-2">
                  <h4 className="font-medium flex items-center text-sm">
                    <GitMerge className="h-4 w-4 mr-1" />
                    Example
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Before optimization:
                  </p>
                  <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
                    {`SELECT c.name
FROM customers c
WHERE c.customer_id IN (
  SELECT o.customer_id
  FROM orders o
  WHERE o.total_amount > 100
);`}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    After optimization:
                  </p>
                  <pre className="bg-muted p-2 rounded-md text-xs mt-1 overflow-x-auto">
                    {`SELECT DISTINCT c.name
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.total_amount > 100;`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Analyze SQL</h3>
                <p className="text-sm text-muted-foreground">
                  Breaks down an existing SQL query to explain what it does in plain language. This helps when you're
                  trying to understand complex queries or need to document your SQL code for others.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Follow-up Queries</h3>
                <p className="text-sm text-muted-foreground">
                  Suggests related or follow-up queries based on your current query. This is useful for exploratory
                  data analysis or discovering new insights that build upon your initial question.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger className="text-md font-medium">Tips</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Writing Effective Queries</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Be specific about what data you want to retrieve</li>
                  <li>Mention table and column names if you know them</li>
                  <li>Specify any filtering conditions clearly</li>
                  <li>Indicate how you want the results ordered or grouped</li>
                  <li>For complex queries, break down your request into smaller parts</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Natural Language Query Examples</h3>
                <div className="space-y-2">
                  <div className="border rounded-md p-3">
                    <p className="text-sm">
                      <strong>Basic query:</strong> "Show all customers who signed up in the last 30 days"
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <p className="text-sm">
                      <strong>Intermediate query:</strong> "List the top 5 products by revenue in Q1 2023, including their category and total units sold"
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <p className="text-sm">
                      <strong>Advanced query:</strong> "Find customers who purchased Product A but not Product B, and who spent more than $500 in total since January, ordered by their most recent purchase date"
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
                <div className="space-y-2">
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Incorrect Table or Column Names
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      If the generated SQL uses incorrect table or column names, provide a more detailed schema
                      and be explicit about the names in your query.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Query Too Complex
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      For very complex queries, try breaking your request into multiple simpler queries
                      and combining the results afterward.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Optimization Suggestions Not Helpful
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      If optimization suggestions don't seem helpful, try providing more information about your
                      database size, indexes, and specific performance issues you're experiencing.
                    </p>
                  </div>
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
