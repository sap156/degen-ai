import React from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DataQuery = () => {
  return (
    <ApiKeyRequirement>
      <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Data Query</CardTitle>
            <CardDescription>
              Query and analyze your data using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This feature is under development. Please check back later.</p>
          </CardContent>
        </Card>
      </div>
    </ApiKeyRequirement>
  );
};

export default DataQuery;
