
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetInfo } from '@/services/imbalancedDataService';
import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DatasetSummaryProps {
  datasetInfo: DatasetInfo;
  additionalStats?: {
    missingValues?: number;
    duplicates?: number;
    outliers?: number;
  };
}

const DatasetSummary: React.FC<DatasetSummaryProps> = ({ 
  datasetInfo,
  additionalStats
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Samples:</p>
            <p className="text-lg font-medium">{datasetInfo.totalSamples}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Imbalance Ratio:</p>
            <p className="text-lg font-medium">{datasetInfo.imbalanceRatio}:1</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Number of Classes:</p>
            <p className="text-lg font-medium">{datasetInfo.classes.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status:</p>
            <Badge 
              variant={datasetInfo.isImbalanced ? "destructive" : "default"}
              className="mt-1"
            >
              {datasetInfo.isImbalanced ? "Imbalanced" : "Balanced"}
            </Badge>
          </div>
        </div>

        {additionalStats && (
          <div className="grid grid-cols-3 gap-4 mt-6 border-t pt-4">
            {additionalStats.missingValues !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Missing Values:</p>
                <p className="text-lg font-medium">{additionalStats.missingValues}</p>
              </div>
            )}
            {additionalStats.duplicates !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Duplicates:</p>
                <p className="text-lg font-medium">{additionalStats.duplicates}</p>
              </div>
            )}
            {additionalStats.outliers !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Outliers:</p>
                <p className="text-lg font-medium">{additionalStats.outliers}</p>
              </div>
            )}
          </div>
        )}

        {datasetInfo.classes.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium flex items-center mb-3">
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              Class Distribution
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium">
                <div className="col-span-3">Class</div>
                <div className="col-span-2">Count</div>
                <div className="col-span-2">Percentage</div>
                <div className="col-span-5"></div>
              </div>
              {datasetInfo.classes.map((cls, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 text-sm items-center">
                  <div className="col-span-3">{cls.className}</div>
                  <div className="col-span-2">{cls.count}</div>
                  <div className="col-span-2">{cls.percentage}%</div>
                  <div className="col-span-5 flex items-center">
                    <div 
                      className="h-3 rounded" 
                      style={{ 
                        backgroundColor: cls.color,
                        width: `${Math.max(cls.percentage, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatasetSummary;
