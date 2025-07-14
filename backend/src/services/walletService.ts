import Web3 from 'web3';
import { 
  AVALANCHE_NETWORKS, 
  getAvaxPrice, 
  getTransactionsFromSnowTrace,
  getTokenBalances,
  getWalletFirstActivity
} from '../config/web3';
import Event from '../models/Events';
import User from '../models/Users';
import NodeCache from 'node-cache';

// Cache para transacciones (1 hora)
const transactionCache = new NodeCache({ stdTTL: 3600 });
// Cache para balances (5 minutos)
const balanceCache = new NodeCache({ stdTTL: 300 });

export class WalletService {
  
  async getWalletInfo(address: string) {
    try {
      console.log(`Fetching wallet info for: ${address}`);
      
      const [
        balanceInfo,
        transactions,
        userInfo,
        eventParticipation,
        firstActivity
      ] = await Promise.all([
        this.getWalletBalance(address),
        this.getWalletTransactions(address),
        this.getUserByWallet(address),
        this.getWalletEventParticipation(address),
        this.getWalletFirstActivity(address)
      ]);

      console.log(`Found ${transactions.length} transactions for ${address}`);

      const eventTransactions = await this.getEventRelatedTransactions(address, eventParticipation);
      const metrics = this.calculateWalletMetrics(transactions, eventTransactions, eventParticipation, firstActivity);

      return {
        address,
        balance: balanceInfo,
        transactions,
        eventTransactions,
        userInfo,
        events: eventParticipation,
        metrics
      };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      throw error;
    }
  }

  private async getWalletBalance(address: string) {
    const cacheKey = `balance_${address}`;
    const cachedBalance = balanceCache.get(cacheKey);
    
    if (cachedBalance) {
      return cachedBalance as any;
    }

    try {
      console.log(`Fetching balance for: ${address}`);
      const avaxPrice = await getAvaxPrice();
      
      // Obtener balance nativo de ambas redes
      const [mainnetBalance, fujiBalance] = await Promise.all([
        AVALANCHE_NETWORKS.mainnet.web3.eth.getBalance(address).catch(() => '0'),
        AVALANCHE_NETWORKS.fuji.web3.eth.getBalance(address).catch(() => '0')
      ]);

      const mainnetAvax = parseFloat(Web3.utils.fromWei(mainnetBalance.toString(), 'ether'));
      const fujiAvax = parseFloat(Web3.utils.fromWei(fujiBalance.toString(), 'ether'));
      const totalAvax = mainnetAvax + fujiAvax;

      // Obtener balances de tokens (solo mainnet por ahora)
      const tokenBalances = await getTokenBalances(address, 'avalanche');

      const result = {
        avax: totalAvax,
        usd: totalAvax * avaxPrice,
        mainnet: {
          avax: mainnetAvax,
          usd: mainnetAvax * avaxPrice
        },
        fuji: {
          avax: fujiAvax,
          usd: fujiAvax * avaxPrice
        },
        tokens: tokenBalances
      };

      balanceCache.set(cacheKey, result);
      console.log(`Balance for ${address}: ${totalAvax} AVAX ($${(totalAvax * avaxPrice).toFixed(2)})`);
      
      return result;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return { avax: 0, usd: 0, mainnet: { avax: 0, usd: 0 }, fuji: { avax: 0, usd: 0 }, tokens: [] };
    }
  }

  private async getWalletTransactions(address: string) {
    const cacheKey = `transactions_${address}`;
    const cachedTransactions = transactionCache.get(cacheKey);
    
    if (cachedTransactions) {
      console.log(`Using cached transactions for ${address}`);
      return cachedTransactions as any[];
    }

    try {
      console.log(`Fetching real transactions for: ${address}`);
      
      // Obtener transacciones de ambas redes
      const [mainnetTxs, fujiTxs] = await Promise.all([
        getTransactionsFromSnowTrace(address, 'avalanche', 1, 100),
        getTransactionsFromSnowTrace(address, 'fuji', 1, 50)
      ]);

      const allTransactions = [...mainnetTxs, ...fujiTxs]
        .sort((a, b) => b.timestamp - a.timestamp); // Más recientes primero

      console.log(`Found ${allTransactions.length} real transactions (${mainnetTxs.length} mainnet, ${fujiTxs.length} fuji)`);
      
      transactionCache.set(cacheKey, allTransactions);
      return allTransactions;
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      return [];
    }
  }

  private async getWalletFirstActivity(address: string) {
    try {
      const [mainnetFirst, fujiFirst] = await Promise.all([
        getWalletFirstActivity(address, 'avalanche'),
        getWalletFirstActivity(address, 'fuji')
      ]);

      // Usar la fecha más antigua entre las dos redes
      let firstActivity = null;
      
      if (mainnetFirst && fujiFirst) {
        firstActivity = mainnetFirst.firstTransactionDate < fujiFirst.firstTransactionDate 
          ? mainnetFirst : fujiFirst;
      } else if (mainnetFirst) {
        firstActivity = mainnetFirst;
      } else if (fujiFirst) {
        firstActivity = fujiFirst;
      }

      return firstActivity;
    } catch (error) {
      console.error('Error getting wallet first activity:', error);
      return null;
    }
  }

  private async getUserByWallet(address: string) {
    try {
      const user = await User.findOne({
        'walletAddresses': { $in: [address.toLowerCase()] }
      }).select('name email _id');

      if (user) {
        return {
          name: user.name,
          email: user.email,
          userId: user._id.toString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding user by wallet:', error);
      return null;
    }
  }

  private async getWalletEventParticipation(address: string) {
    try {
      const events = await Event.find({
        $or: [
          { 'openedWalletAddresses': { $in: [address.toLowerCase()] } },
          { 'registeredAttendees.walletAddress': address.toLowerCase() }
        ]
      }).select('name date _id');

      return events.map(event => ({
        eventId: event._id.toString(),
        eventName: event.name,
        eventDate: event.date,
        registeredDate: new Date().toISOString(),
        attended: Math.random() > 0.3, // TODO: Implementar lógica real de asistencia
        walletCreatedDuringEvent: false // TODO: Calcular basado en primera transacción
      }));
    } catch (error) {
      console.error('Error getting wallet event participation:', error);
      return [];
    }
  }

  private async getEventRelatedTransactions(address: string, events: any[]) {
    const eventTransactions = [];
    
    for (const event of events) {
      const eventDate = new Date(event.eventDate);
      const eventStart = eventDate.getTime();
      const eventEnd = eventStart + (24 * 60 * 60 * 1000); // 24 horas después
      const afterEventEnd = eventEnd + (7 * 24 * 60 * 60 * 1000); // 7 días después

      // TODO: Filtrar transacciones reales por fecha
      eventTransactions.push({
        eventId: event.eventId,
        eventName: event.eventName,
        eventDate: event.eventDate,
        duringEvent: [], // Se llenarán con transacciones filtradas por fecha
        afterEvent: []
      });
    }

    return eventTransactions;
  }

  private calculateWalletMetrics(transactions: any[], eventTransactions: any[], events: any[], firstActivity: any) {
    const totalTransactions = transactions.length;
    
    // Calcular valor total transferido
    const totalValueTransferred = transactions.reduce((sum, tx) => {
      try {
        return sum + parseFloat(Web3.utils.fromWei(tx.value || '0', 'ether'));
      } catch {
        return sum;
      }
    }, 0);

    const transactionsDuringEvents = eventTransactions.reduce((sum, group) => 
      sum + group.duringEvent.length, 0
    );

    const transactionsAfterEvents = eventTransactions.reduce((sum, group) => 
      sum + group.afterEvent.length, 0
    );

    const averageTransactionValue = totalTransactions > 0 ? 
      totalValueTransferred / totalTransactions : 0;

    // Calcular edad de la wallet usando la primera actividad real
    let walletAge = 0;
    if (firstActivity?.firstTransactionDate) {
      walletAge = Math.floor((Date.now() - firstActivity.firstTransactionDate) / (24 * 60 * 60 * 1000));
    } else if (transactions.length > 0) {
      // Fallback: usar la transacción más antigua disponible
      const oldestTx = transactions.reduce((oldest, tx) => 
        tx.timestamp < oldest.timestamp ? tx : oldest, transactions[0]
      );
      walletAge = Math.floor((Date.now() - oldestTx.timestamp) / (24 * 60 * 60 * 1000));
    }

    // Score de actividad basado en datos reales
    let activityScore = 0;
    
    // Puntos por cantidad de transacciones (máximo 40 puntos)
    activityScore += Math.min(totalTransactions * 0.2, 40);
    
    // Puntos por consistencia temporal (máximo 20 puntos)
    if (walletAge > 0) {
      const avgTxPerDay = totalTransactions / walletAge;
      activityScore += Math.min(avgTxPerDay * 10, 20);
    }
    
    // Puntos por valor total (máximo 20 puntos)
    activityScore += Math.min(totalValueTransferred * 0.5, 20);
    
    // Puntos por participación en eventos (máximo 20 puntos)
    activityScore += Math.min(events.length * 10, 20);

    console.log(`Calculated metrics for wallet: ${totalTransactions} txs, ${walletAge} days old, score: ${Math.round(activityScore)}`);

    return {
      totalTransactions,
      totalValueTransferred,
      eventsParticipated: events.length,
      transactionsDuringEvents,
      transactionsAfterEvents,
      averageTransactionValue,
      mostActiveEvent: events.length > 0 ? events[0].eventName : null,
      walletAge,
      activityScore: Math.min(Math.round(activityScore), 100)
    };
  }

  async searchWallet(address: string) {
    try {
      const userInfo = await this.getUserByWallet(address);
      const events = await Event.find({
        $or: [
          { 'openedWalletAddresses': { $in: [address.toLowerCase()] } },
          { 'registeredAttendees.walletAddress': address.toLowerCase() }
        ]
      }).countDocuments();

      return {
        address,
        found: true, // Siempre verdadero para permitir análisis
        userInfo,
        eventsCount: events
      };
    } catch (error) {
      console.error('Error searching wallet:', error);
      return {
        address,
        found: true,
        eventsCount: 0
      };
    }
 
  }
}