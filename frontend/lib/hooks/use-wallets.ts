import { useQuery } from 'react-query';
import { walletsApi } from '@/lib/api/wallets-api';

export function useWallets() {
  const searchWallet = (address: string) => 
    useQuery(
      ['wallet-search', address],
      () => walletsApi.searchWallet(address),
      {
        enabled: !!address && address.length === 42, // Solo ejecutar si es una dirección válida
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutos
      }
    );

  const getWalletInfo = (address: string) =>
    useQuery(
      ['wallet-info', address],
      () => walletsApi.getWalletInfo(address),
      {
        enabled: !!address && address.length === 42,
        retry: 1,
        staleTime: 2 * 60 * 1000, // 2 minutos
      }
    );

  return {
    searchWallet,
    getWalletInfo
  };
} 