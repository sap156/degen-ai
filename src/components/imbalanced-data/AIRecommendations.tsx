
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Brain } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AIRecommendationsProps {
  recommendations: string;
  isLoading: boolean;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  recommendations, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Separator />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  // Display the recommendations with line breaks and formatting
  const formattedRecommendations = recommendations.split('\n').map((line, index) => {
    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
      return (
        <React.Fragment key={index}>
          <Separator className="my-2" />
          <p className="font-medium text-primary mt-3">{line}</p>
        </React.Fragment>
      );
    }
    return <p key={index} className={line === "" ? "my-2" : ""}>{line}</p>;
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="prose max-w-none">
        {formattedRecommendations}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
