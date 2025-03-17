
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetInfo } from '@/services/imbalancedDataService';
import { BarChart3 } from 'lucide-react';

interface DatasetVisualizationProps {
  datasetInfo: DatasetInfo;
}

const DatasetVisualization: React.FC<DatasetVisualizationProps> = ({ datasetInfo }) => {
  // Prepare chart data
  const chartData = {
    labels: datasetInfo.classes.map(c => c.className),
    datasets: [
      {
        label: 'Sample Count',
        data: datasetInfo.classes.map(c => c.count),
        backgroundColor: datasetInfo.classes.map(c => c.color),
        borderColor: datasetInfo.classes.map(c => c.color),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sample Count',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Class',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const total = datasetInfo.totalSamples;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-primary" />
          Class Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetVisualization;
