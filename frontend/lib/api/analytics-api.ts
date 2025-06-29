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
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  // Fallback para respuestas directas
  return response.data as OverallMetrics;
};

export const getUserMetrics = async (): Promise<UserMetrics[]> => {
  const response = await apiClient.get<ApiResponse<UserMetrics[]>>('/analytics/users');
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data as UserMetrics[];
};

export const getTimelineMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<TimelineMetric[]> => {
  const params = { startDate, endDate };
  const response = await apiClient.get<ApiResponse<TimelineMetric[]>>('/analytics/timeline', { params });
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data as TimelineMetric[];
};

export const getRegionMetrics = async (): Promise<RegionMetrics[]> => {
  const response = await apiClient.get<ApiResponse<RegionMetrics[]>>('/analytics/regions');
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data as RegionMetrics[];
};

export const getWalletMetrics = async (): Promise<WalletMetrics> => {
  const response = await apiClient.get<ApiResponse<WalletMetrics>>('/analytics/wallets');
  
  if (response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return response.data as WalletMetrics;
};