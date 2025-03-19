
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Database, MessageSquare, Code, Search, HelpCircle } from 'lucide-react';

const UserGuideDataQuery = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Data Query Service Guide
        </CardTitle>
        <CardDescription>
          Learn how to use natural language to generate and optimize SQL queries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="about">
            <AccordionTrigger>What is the Data Query Service?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                The Data Query Service allows you to convert natural language questions into SQL queries.
                Instead of writing complex SQL manually, you can describe what you want to find in plain English,
                and the AI will generate the appropriate SQL query. You can also get optimized queries, analysis of
                existing queries, and follow-up query suggestions.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Natural Language to SQL:</span> Convert questions into SQL queries</li>
                <li><span className="font-medium">Schema-Aware:</span> Generate queries based on your database structure</li>
                <li><span className="font-medium">Query Optimization:</span> Improve performance of existing queries</li>
                <li><span className="font-medium">Query Analysis:</span> Get insights into what your queries are doing</li>
                <li><span className="font-medium">Follow-up Suggestions:</span> Get related query ideas to explore your data further</li>
                <li><span className="font-medium">Multi-Database Support:</span> Works with various SQL dialects</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="howto">
            <AccordionTrigger>How to Use</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Provide Schema Information:</span> Upload or paste your database schema to help the AI understand your data structure</li>
                <li><span className="font-medium">Enter Your Question:</span> Type a natural language question about your data</li>
                <li><span className="font-medium">Select Processing Mode:</span> Choose whether to generate a new query, optimize an existing one, analyze a query, or get follow-up suggestions</li>
                <li><span className="font-medium">Generate SQL:</span> Let the AI convert your question to SQL</li>
                <li><span className="font-medium">Review and Edit:</span> Check the generated SQL and make any necessary adjustments</li>
                <li><span className="font-medium">Run or Save:</span> Execute the query against your database or save it for later use</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="schema">
            <AccordionTrigger>Providing Schema Information</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-2">
                For best results, provide information about your database schema. You can:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Upload SQL CREATE TABLE statements</li>
                <li>Paste table definitions in various formats</li>
                <li>Describe your tables and relationships in plain English</li>
                <li>Provide example data for schema inference</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                The more accurate and complete your schema information, the better the generated queries will be.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger>Tips & Best Practices</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Be specific in your questions to get more accurate queries</li>
                <li>Provide sample data or schema information for better results</li>
                <li>Review generated SQL before execution, especially for complex queries</li>
                <li>Use simple language first, then refine with more technical terms if needed</li>
                <li>For complex queries, break them down into smaller related questions</li>
                <li>Use follow-up mode to explore related aspects of your data</li>
                <li>Always validate the results against what you expected</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="usecases">
            <AccordionTrigger>Common Use Cases</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Data Exploration:</span> Quickly generate queries to explore unfamiliar databases</li>
                <li><span className="font-medium">Report Generation:</span> Create queries for business reports and dashboards</li>
                <li><span className="font-medium">Query Optimization:</span> Improve performance of slow-running queries</li>
                <li><span className="font-medium">SQL Learning:</span> Use as a learning tool to understand how to write SQL for specific questions</li>
                <li><span className="font-medium">Data Analysis:</span> Generate complex analytical queries without deep SQL expertise</li>
                <li><span className="font-medium">Database Documentation:</span> Generate queries to better understand database structure and relationships</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataQuery;
