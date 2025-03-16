
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModelTesterProps {
  loading: boolean;
  testResults: any | null;
  targetColumn: string;
}

const ModelTester: React.FC<ModelTesterProps> = ({
  loading,
  testResults,
  targetColumn
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-indigo-500" />
            Testing Model Against Edge Cases...
          </CardTitle>
          <CardDescription>
            Evaluating model performance on edge cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!testResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-indigo-500" />
            Model Testing
          </CardTitle>
          <CardDescription>
            No model testing results available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Test Results</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click the "Test Model" button to evaluate performance on edge cases
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: ['Regular Data', 'Edge Cases'],
    datasets: [
      {
        label: 'Accuracy (%)',
        data: [testResults.overallAccuracy, testResults.edgeCaseAccuracy],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(249, 115, 22, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(249, 115, 22)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Accuracy (%)'
        }
      },
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-indigo-500" />
            Model Testing Results
          </CardTitle>
          <CardDescription>
            Performance evaluation on regular data vs. edge cases
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium mb-4">Performance Comparison</h3>
            <div className="h-64">
              <Bar options={chartOptions} data={chartData} />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Robustness Metrics</h3>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Robustness Score</span>
                <span className="text-sm font-medium">{testResults.robustnessScore}/10</span>
              </div>
              <Progress 
                value={Number(testResults.robustnessScore) * 10} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded-md p-3">
                <div className="flex items-center mb-1">
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm">False Positives</span>
                </div>
                <p className="text-2xl font-semibold">{testResults.falsePositives}</p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center mb-1">
                  <XCircle className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-sm">False Negatives</span>
                </div>
                <p className="text-2xl font-semibold">{testResults.falseNegatives}</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Impacted Features</h3>
              <div className="flex flex-wrap gap-2">
                {testResults.impactedFeatures.map((feature: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-blue-50">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Recommendations</h3>
          <div className="space-y-2 border rounded-md p-4 bg-muted/50">
            {testResults.recommendations.map((recommendation: string, index: number) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 flex items-start">
          <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Edge cases have a significant impact on your model performance. 
            Consider implementing the recommendations and retraining your model.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelTester;
