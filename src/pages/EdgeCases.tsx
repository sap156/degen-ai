
import React from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EdgeCases = () => {
  return (
    <ApiKeyRequirement>
      <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Edge Cases</CardTitle>
            <CardDescription>
              Identify and generate edge cases to improve model robustness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the Edge Cases page.</p>
          </CardContent>
        </Card>
      </div>
    </ApiKeyRequirement>
  );
};

export default EdgeCases;
