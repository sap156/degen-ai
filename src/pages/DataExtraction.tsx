import React from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import DataExtractionComponent from '@/components/DataExtractionComponent';

const DataExtraction = () => {
  return (
    <ApiKeyRequirement>
      <DataExtractionComponent />
    </ApiKeyRequirement>
  );
};

export default DataExtraction;
