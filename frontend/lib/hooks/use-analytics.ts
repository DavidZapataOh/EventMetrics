"use client";

import { useQuery } from 'react-query';
import { 
  getOverallMetrics, 
  getUserMetrics, 
  getTimelineMetrics, 
  getRegionMetrics, 
  getWalletMetrics 
} from '../api/analytics-api';

export function useAnalytics() {
  const overallMetricsQuery = useQuery('overallMetrics', getOverallMetrics);
  
  const userMetricsQuery = useQuery('userMetrics', getUserMetrics);
  
  const timelineMetricsQuery = (startDate?: string, endDate?: string) => 
    useQuery(
      ['timelineMetrics', startDate, endDate], 
      () => getTimelineMetrics(startDate, endDate)
    );
  
  const regionMetricsQuery = useQuery('regionMetrics', getRegionMetrics);
  
  const walletMetricsQuery = useQuery('walletMetrics', getWalletMetrics);

  return {
    overallMetricsQuery,
    userMetricsQuery,
    timelineMetricsQuery,
    regionMetricsQuery,
    walletMetricsQuery,
  };
}