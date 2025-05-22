import apiClient from './axios-config';
import { 
  OverallMetrics, 
  UserMetrics, 
  TimelineMetric, 
  RegionMetrics, 
  WalletMetrics 
} from '@/types/analytics';
import { ApiResponse } from '@/types/api';

export const getOverallMetrics = async (): Promise<OverallMetrics> => {
  const response = await apiClient.get<ApiResponse<OverallMetrics>>('/analytics/overall');
  return response.data.data;
};

export const getUserMetrics = async (): Promise<UserMetrics[]> => {
  const response = await apiClient.get<ApiResponse<UserMetrics[]>>('/analytics/users');
  return response.data.data;
};

export const getTimelineMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<TimelineMetric[]> => {
  const params = { startDate, endDate };
  const response = await apiClient.get<ApiResponse<TimelineMetric[]>>('/analytics/timeline', { params });
  return response.data.data;
};

export const getRegionMetrics = async (): Promise<RegionMetrics[]> => {
  const response = await apiClient.get<ApiResponse<RegionMetrics[]>>('/analytics/regions');
  return response.data.data;
};

export const getWalletMetrics = async (): Promise<WalletMetrics> => {
  const response = await apiClient.get<ApiResponse<WalletMetrics>>('/analytics/wallets');
  return response.data.data;
};