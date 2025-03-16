
import React from 'react';
import { format } from 'date-fns';
import { CalendarRange } from 'lucide-react';

interface DateRangeInfoProps {
  startDate: Date;
  endDate: Date;
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dataPoints: number;
}

const DateRangeInfo: React.FC<DateRangeInfoProps> = ({
  startDate,
  endDate,
  interval = 'daily',
  dataPoints
}) => {
  // Calculate duration
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
  
  // Format readable duration
  let durationText = '';
  if (durationDays < 1) {
    const hours = Math.round(durationMs / (1000 * 60 * 60));
    durationText = `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (durationDays < 7) {
    durationText = `${durationDays} day${durationDays !== 1 ? 's' : ''}`;
  } else if (durationDays < 31) {
    const weeks = Math.round(durationDays / 7);
    durationText = `${weeks} week${weeks !== 1 ? 's' : ''}`;
  } else if (durationDays < 365) {
    const months = Math.round(durationDays / 30);
    durationText = `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.round(durationDays / 365);
    durationText = `${years} year${years !== 1 ? 's' : ''}`;
  }

  return (
    <div className="bg-muted/30 p-3 rounded-md flex items-start space-x-3">
      <CalendarRange className="h-5 w-5 text-primary mt-0.5" />
      <div>
        <h4 className="font-medium text-sm">Dataset Date Range</h4>
        <p className="text-xs text-muted-foreground mt-1">
          From {format(startDate, 'PP')} to {format(endDate, 'PP')}
          <span className="mx-1">•</span>
          {durationText}
        </p>
        <p className="text-xs text-muted-foreground">
          {dataPoints} data points
          <span className="mx-1">•</span>
          {interval} interval
        </p>
      </div>
    </div>
  );
};

export default DateRangeInfo;
