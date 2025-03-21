
import { timeSeriesService, TimeSeriesOptions } from '@/services/timeSeriesService';

export const generateTimeSeriesData = (options: TimeSeriesOptions) => {
  return timeSeriesService.generateTimeSeries(options);
};
