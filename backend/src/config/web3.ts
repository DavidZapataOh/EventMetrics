import Web3 from 'web3';

export const web3Avalanche = new Web3('https://api.avax.network/ext/bc/C/rpc');
export const web3Fuji = new Web3('https://api.avax-test.network/ext/bc/C/rpc');

export const AVALANCHE_NETWORKS = {
  mainnet: {
    name: 'Avalanche',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    web3: web3Avalanche
  },
  fuji: {
    name: 'Avalanche Fuji',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    web3: web3Fuji
  }
};

// Función helper para obtener el precio de AVAX (puedes usar una API como CoinGecko)
export const getAvaxPrice = async (): Promise<number> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd');
    const data = await response.json();
    return data['avalanche-2']?.usd || 0;
  } catch (error) {
    console.error('Error fetching AVAX price:', error);
    return 0;
  }
}; 