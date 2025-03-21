
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Clock, TrendingUp, Waves, Zap } from 'lucide-react';

interface TimeSeriesAugmentorAdapterProps {
  isLoading: boolean;
  handleAugment: () => Promise<void>;
  timeSeriesSettings: {
    startDate: string;
    endDate: string;
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
    pattern: string;
    trendStrength: number;
    seasonalityStrength: number;
    noiseLevel: number;
    outlierPercentage: number;
  };
  handleSettingChange: (field: string, value: any) => void;
}

const TimeSeriesAugmentorAdapter: React.FC<TimeSeriesAugmentorAdapterProps> = ({
  isLoading,
  handleAugment,
  timeSeriesSettings,
  handleSettingChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-500" />
          Time Series Data Generation
        </CardTitle>
        <CardDescription>
          Create synthetic time series data with customizable patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <input 
              type="date" 
              value={timeSeriesSettings.startDate}
              onChange={(e) => handleSettingChange('startDate', e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <input 
              type="date" 
              value={timeSeriesSettings.endDate}
              onChange={(e) => handleSettingChange('endDate', e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Interval</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={timeSeriesSettings.interval}
            onChange={(e) => handleSettingChange('interval', e.target.value)}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <Label>Pattern Type</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={timeSeriesSettings.pattern}
            onChange={(e) => handleSettingChange('pattern', e.target.value)}
          >
            <option value="seasonal">Seasonal</option>
            <option value="trend">Trend</option>
            <option value="cyclical">Cyclical</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Trend Strength</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(timeSeriesSettings.trendStrength * 100)}%
                </span>
              </div>
              <Slider
                value={[timeSeriesSettings.trendStrength * 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={(values) => handleSettingChange('trendStrength', values[0] / 100)}
              />
              <div className="flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-xs text-muted-foreground">Linear trend component</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Noise Level</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(timeSeriesSettings.noiseLevel * 100)}%
                </span>
              </div>
              <Slider
                value={[timeSeriesSettings.noiseLevel * 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={(values) => handleSettingChange('noiseLevel', values[0] / 100)}
              />
              <div className="flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-xs text-muted-foreground">Random variation</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Seasonality Strength</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(timeSeriesSettings.seasonalityStrength * 100)}%
                </span>
              </div>
              <Slider
                value={[timeSeriesSettings.seasonalityStrength * 100]}
                min={0}
                max={100}
                step={5}
                onValueChange={(values) => handleSettingChange('seasonalityStrength', values[0] / 100)}
              />
              <div className="flex items-center justify-center">
                <Waves className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-xs text-muted-foreground">Cyclic seasonal pattern</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Outlier Percentage</Label>
                <span className="text-sm text-muted-foreground">
                  {timeSeriesSettings.outlierPercentage}%
                </span>
              </div>
              <Slider
                value={[timeSeriesSettings.outlierPercentage]}
                min={0}
                max={20}
                step={1}
                onValueChange={(values) => handleSettingChange('outlierPercentage', values[0])}
              />
              <div className="flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Percentage of data points that are outliers</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAugment} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Generating...' : 'Generate Time Series Data'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesAugmentorAdapter;
