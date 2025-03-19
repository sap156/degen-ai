
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EdgeCaseDetector from '@/components/EdgeCaseDetector';
import EdgeCaseGenerator from '@/components/EdgeCaseGenerator';
import EdgeCaseReport from '@/components/EdgeCaseReport';
import UserGuideEdgeCases from '@/components/ui/UserGuideEdgeCases';
import { Bug } from 'lucide-react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { useApiKey } from '@/contexts/ApiKeyContext';

const EdgeCases = () => {
  const [activeTab, setActiveTab] = useState('detect');
  const { hasApiKey } = useApiKey();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bug className="h-8 w-8 text-primary" />
          Edge Cases Explorer
        </h1>
        <p className="text-muted-foreground">
          Identify, generate, and test edge cases in your data to improve model robustness
        </p>
      </div>
      
      {!hasApiKey ? (
        <ApiKeyRequirement />
      ) : (
        <Tabs defaultValue="detect" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="detect">Detect Edge Cases</TabsTrigger>
            <TabsTrigger value="generate">Generate Test Cases</TabsTrigger>
            <TabsTrigger value="test">Test & Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detect" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Edge Case Detection</CardTitle>
                <CardDescription>
                  Upload your dataset and identify potential edge cases and outliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EdgeCaseDetector />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Synthetic Edge Case Generator</CardTitle>
                <CardDescription>
                  Create synthetic edge cases to test your models and systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EdgeCaseGenerator />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="test" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Edge Case Testing & Reporting</CardTitle>
                <CardDescription>
                  Test model performance on edge cases and generate detailed reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EdgeCaseReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      <UserGuideEdgeCases />
    </div>
  );
};

export default EdgeCases;
