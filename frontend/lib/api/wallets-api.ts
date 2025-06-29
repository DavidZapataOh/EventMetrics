import apiClient from './axios-config';
import { WalletInfo, WalletSearchResult } from '@/types/wallet';
import { ApiResponse } from '@/types/api';

export const walletsApi = {
  searchWallet: async (address: string): Promise<WalletSearchResult> => {
    const response = await apiClient.get<ApiResponse<WalletSearchResult>>(
      `/wallets/search?address=${encodeURIComponent(address)}`
    );
    return response.data.data;
  },

  getWalletInfo: async (address: string): Promise<WalletInfo> => {
    const response = await apiClient.get<ApiResponse<WalletInfo>>(
      `/wallets/${encodeURIComponent(address)}`
    );
    return response.data.data;
  }
}; 