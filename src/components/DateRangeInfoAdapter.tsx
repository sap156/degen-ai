
import React from 'react';

interface DateRangeInfoAdapterProps {
  startDate: Date;
  endDate: Date;
  dataPoints?: number;
}

const DateRangeInfoAdapter: React.FC<DateRangeInfoAdapterProps> = ({
  startDate,
  endDate,
  dataPoints = 100
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysDifference = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div className="flex justify-between">
        <span>Start Date:</span>
        <span className="font-medium">{formatDate(startDate)}</span>
      </div>
      <div className="flex justify-between">
        <span>End Date:</span>
        <span className="font-medium">{formatDate(endDate)}</span>
      </div>
      <div className="flex justify-between">
        <span>Period:</span>
        <span className="font-medium">{calculateDaysDifference()} days</span>
      </div>
      <div className="flex justify-between">
        <span>Data Points:</span>
        <span className="font-medium">{dataPoints}</span>
      </div>
    </div>
  );
};

export default DateRangeInfoAdapter;
