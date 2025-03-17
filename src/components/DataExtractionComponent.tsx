
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DataExtractionComponent: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Extraction</h1>
        <p className="text-muted-foreground mt-2">
          Extract structured data from unstructured content using AI
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Extraction</CardTitle>
          <CardDescription>
            Extract structured data from text, images, PDFs, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This feature is under development. Please check back later.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExtractionComponent;
