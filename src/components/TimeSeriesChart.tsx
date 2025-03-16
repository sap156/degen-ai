
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
  defaultValue?: string; // Set the default value field name, if any
}

const TimeSeriesChart = ({ 
  data, 
  title, 
  additionalFields = [], 
  height = 400,
  className,
  defaultValue = 'value' // Default to 'value' for backward compatibility
}: TimeSeriesChartProps) => {
  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      // Format timestamp for display
      formattedTime: format(parseISO(point.timestamp), 'MMM dd, yyyy HH:mm')
    }));
  }, [data]);
  
  // Check if the default value field exists in the data
  const hasDefaultValue = useMemo(() => {
    return data.length > 0 && defaultValue in data[0];
  }, [data, defaultValue]);
  
  // Get all numeric fields from the data for charting
  const numericFields = useMemo(() => {
    if (data.length === 0) return [];
    
    const fields: string[] = [];
    const firstPoint = data[0];
    
    // Add the default value field if it exists and is not excluded
    if (hasDefaultValue && defaultValue) {
      fields.push(defaultValue);
    }
    
    // Add all additional fields that are numeric
    for (const field of additionalFields) {
      if (field in firstPoint && typeof firstPoint[field] === 'number' && field !== defaultValue) {
        fields.push(field);
      }
    }
    
    // Add any other numeric fields that might exist in the data
    Object.entries(firstPoint).forEach(([key, value]) => {
      if (
        typeof value === 'number' && 
        key !== defaultValue && 
        key !== 'timestamp' && 
        !fields.includes(key) &&
        !key.includes('formatted')
      ) {
        fields.push(key);
      }
    });
    
    return fields;
  }, [data, additionalFields, defaultValue, hasDefaultValue]);
  
  // Generate a different color for each field
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
  
  if (numericFields.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-muted-foreground">No numeric fields found to display in chart</p>
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
                formatter={(value, name) => [value, name === defaultValue ? 'Value' : name]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              
              {numericFields.map((field, index) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  stroke={getLineColor(index)}
                  activeDot={{ r: 8 }}
                  name={field === defaultValue ? 'Value' : field}
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
