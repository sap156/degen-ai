
import { generateTimeSeriesData as generateTimeSeries, TimeSeriesOptions } from '@/services/timeSeriesService';

export const generateTimeSeriesData = (options: TimeSeriesOptions) => {
  return generateTimeSeries(options);
};
