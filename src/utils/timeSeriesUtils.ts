
import { timeSeriesService, TimeSeriesOptions } from "@/services/timeSeriesService";

export const generateTimeSeriesWithDate = (startDate: Date, endDate: Date, interval: string = 'daily', count: number = 100) => {
  const options: TimeSeriesOptions = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    interval: interval as any,
    dataPoints: count
  };
  
  return timeSeriesService.generateTimeSeries(options);
};
