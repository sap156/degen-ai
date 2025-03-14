
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TimeSeriesDataPoint } from '@/services/timeSeriesService';
import { Card, CardContent } from '@/components/ui/card';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  additionalFields?: string[];
  height?: number;
  className?: string;
}

const TimeSeriesChart = ({ 
  data, 
  title, 
  additionalFields = [], 
  height = 400,
  className
}: TimeSeriesChartProps) => {
  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      // Format timestamp for display
      formattedTime: format(parseISO(point.timestamp), 'MMM dd, yyyy HH:mm')
    }));
  }, [data]);
  
  // Generate a different color for each additional field
  const getLineColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28'];
    return colors[index % colors.length];
  };
  
  if (!data.length) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">No data available to display</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardContent>
        {title && <h3 className="text-lg font-medium mb-4">{title}</h3>}
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedTime" 
                tick={{ fontSize: 12 }} 
                angle={-45} 
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [value, name === 'value' ? 'Value' : name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Value"
              />
              {additionalFields.map((field, index) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  stroke={getLineColor(index + 1)}
                  name={field}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
