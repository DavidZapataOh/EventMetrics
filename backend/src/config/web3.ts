import Web3 from 'web3';
import axios from 'axios';

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

// Configuración de APIs externas
export const BLOCKCHAIN_APIS = {
  snowtrace: {
    baseUrl: 'https://api.snowtrace.io/api',
    // Puedes obtener una API key gratuita en https://snowtrace.io/apis
    apiKey: process.env.SNOWTRACE_API_KEY || 'YourApiKeyToken'
  },
  fujiTrace: {
    baseUrl: 'https://api-testnet.snowtrace.io/api',
    apiKey: process.env.SNOWTRACE_API_KEY || 'YourApiKeyToken'
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3'
  }
};

// Cliente HTTP configurado para APIs de blockchain
export const blockchainApiClient = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'EventMetrics/1.0'
  }
});

// Función para obtener transacciones usando Snowtrace API
export const getTransactionsFromSnowTrace = async (
  address: string, 
  network: 'avalanche' | 'fuji' = 'avalanche',
  page = 1,
  offset = 100
) => {
  try {
    const api = network === 'avalanche' ? BLOCKCHAIN_APIS.snowtrace : BLOCKCHAIN_APIS.fujiTrace;
    
    const response = await blockchainApiClient.get(api.baseUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        endblock: 99999999,
        page: page,
        offset: offset,
        sort: 'desc',
        apikey: api.apiKey
      }
    });

    if (response.data?.status === '1' && response.data?.result) {
      return response.data.result.map((tx: any) => ({
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: parseInt(tx.timeStamp) * 1000, // Convertir a millisegundos
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        status: parseInt(tx.txreceipt_status || '1'),
        network,
        methodId: tx.methodId,
        functionName: tx.functionName || null,
        contractAddress: tx.contractAddress || null,
        cumulativeGasUsed: tx.cumulativeGasUsed,
        confirmations: tx.confirmations
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching transactions from ${network}:`, (error as Error).message);
    return [];
  }
};

// Función para obtener el balance de tokens ERC-20
export const getTokenBalances = async (address: string, network: 'avalanche' | 'fuji' = 'avalanche') => {
  try {
    const api = network === 'avalanche' ? BLOCKCHAIN_APIS.snowtrace : BLOCKCHAIN_APIS.fujiTrace;
    
    const response = await blockchainApiClient.get(api.baseUrl, {
      params: {
        module: 'account',
        action: 'tokenlist',
        address: address,
        apikey: api.apiKey
      }
    });

    if (response.data?.status === '1' && response.data?.result) {
      return response.data.result.map((token: any) => ({
        contractAddress: token.contractAddress,
        name: token.name,
        symbol: token.symbol,
        decimals: parseInt(token.decimals),
        balance: token.balance,
        type: token.type || 'ERC-20'
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching token balances from ${network}:`, (error as Error).message);
    return [];
  }
};

// Función helper para obtener el precio de AVAX
export const getAvaxPrice = async (): Promise<number> => {
  try {
    const response = await blockchainApiClient.get(`${BLOCKCHAIN_APIS.coingecko.baseUrl}/simple/price`, {
      params: {
        ids: 'avalanche-2',
        vs_currencies: 'usd'
      }
    });
    return response.data['avalanche-2']?.usd || 0;
  } catch (error) {
    console.error('Error fetching AVAX price:', error);
    return 0;
  }
};

// Función para obtener información del primer y último bloque
export const getWalletFirstActivity = async (address: string, network: 'avalanche' | 'fuji' = 'avalanche') => {
  try {
    const api = network === 'avalanche' ? BLOCKCHAIN_APIS.snowtrace : BLOCKCHAIN_APIS.fujiTrace;
    
    // Obtener la primera transacción (oldest first)
    const response = await blockchainApiClient.get(api.baseUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 1,
        sort: 'asc', // Más antiguas primero
        apikey: api.apiKey
      }
    });

    if (response.data?.status === '1' && response.data?.result?.length > 0) {
      const firstTx = response.data.result[0];
      return {
        firstTransactionDate: parseInt(firstTx.timeStamp) * 1000,
        firstBlockNumber: parseInt(firstTx.blockNumber)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching first activity from ${network}:`, (error as Error).message);
    return null;
  }
}; 