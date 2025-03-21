
import { generateTimeSeriesData, TimeSeriesOptions } from '@/services/timeSeriesService';

export const generateTimeSeriesWithDate = (startDate: Date, endDate: Date, interval: string = 'daily', count: number = 100) => {
  const options: TimeSeriesOptions = {
    startDate,
    endDate,
    interval: interval as any,
    dataPoints: count
  };
  
  return generateTimeSeriesData(options);
};
