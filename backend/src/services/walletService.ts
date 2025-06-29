import Web3 from 'web3';
import { AVALANCHE_NETWORKS, getAvaxPrice } from '../config/web3';
import Event from '../models/Events';
import User from '../models/Users';
import NodeCache from 'node-cache';

// Cache para transacciones (24 horas)
const transactionCache = new NodeCache({ stdTTL: 86400 });

export class WalletService {
  
  async getWalletInfo(address: string) {
    try {
      const [
        balanceInfo,
        transactions,
        userInfo,
        eventParticipation
      ] = await Promise.all([
        this.getWalletBalance(address),
        this.getWalletTransactions(address),
        this.getUserByWallet(address),
        this.getWalletEventParticipation(address)
      ]);

      const eventTransactions = await this.getEventRelatedTransactions(address, eventParticipation);
      const metrics = this.calculateWalletMetrics(transactions, eventTransactions, eventParticipation);

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
    try {
      const avaxPrice = await getAvaxPrice();
      
      // Obtener balance de ambas redes
      const [mainnetBalance, fujiBalance] = await Promise.all([
        AVALANCHE_NETWORKS.mainnet.web3.eth.getBalance(address),
        AVALANCHE_NETWORKS.fuji.web3.eth.getBalance(address)
      ]);

      const mainnetAvax = parseFloat(Web3.utils.fromWei(mainnetBalance, 'ether'));
      const fujiAvax = parseFloat(Web3.utils.fromWei(fujiBalance, 'ether'));
      const totalAvax = mainnetAvax + fujiAvax;

      return {
        avax: totalAvax,
        usd: totalAvax * avaxPrice
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return { avax: 0, usd: 0 };
    }
  }

  private async getWalletTransactions(address: string) {
    const cacheKey = `transactions_${address}`;
    const cachedTransactions = transactionCache.get(cacheKey);
    
    if (cachedTransactions) {
      return cachedTransactions as any[];
    }

    try {
      // En un caso real, usarías APIs como Snowtrace
      // Por ahora simulamos con las últimas transacciones de cada red
      const [mainnetTxs, fujiTxs] = await Promise.all([
        this.getTransactionsFromNetwork(address, 'avalanche'),
        this.getTransactionsFromNetwork(address, 'fuji')
      ]);

      const allTransactions = [...mainnetTxs, ...fujiTxs]
        .sort((a, b) => b.timestamp - a.timestamp);

      transactionCache.set(cacheKey, allTransactions);
      return allTransactions;
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      return [];
    }
  }

  private async getTransactionsFromNetwork(address: string, network: 'avalanche' | 'fuji') {
    try {
      const web3 = AVALANCHE_NETWORKS[network === 'avalanche' ? 'mainnet' : 'fuji'].web3;
      const currentBlock = await web3.eth.getBlockNumber();
      const transactions = [];

      // Buscar en los últimos 1000 bloques
      for (let i = 0; i < 10; i++) {
        const blockNumber = currentBlock - i * 100;
        const block = await web3.eth.getBlock(blockNumber, true);
        
        if (block && block.transactions) {
          const blockTransactions = block.transactions.filter((tx: any) => 
            tx.from?.toLowerCase() === address.toLowerCase() || 
            tx.to?.toLowerCase() === address.toLowerCase()
          );

          for (const tx of blockTransactions) {
            const receipt = await web3.eth.getTransactionReceipt(tx.hash);
            transactions.push({
              hash: tx.hash,
              blockNumber: tx.blockNumber,
              timestamp: Number(block.timestamp) * 1000,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              gasPrice: tx.gasPrice,
              gasUsed: receipt.gasUsed,
              status: receipt.status ? 1 : 0,
              network
            });
          }
        }
      }

      return transactions;
    } catch (error) {
      console.error(`Error getting transactions from ${network}:`, error);
      return [];
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
        registeredDate: new Date().toISOString(), // En un caso real obtener la fecha real
        attended: true, // En un caso real verificar asistencia
        walletCreatedDuringEvent: false // En un caso real verificar si se creó durante el evento
      }));
    } catch (error) {
      console.error('Error getting wallet event participation:', error);
      return [];
    }
  }

  private async getEventRelatedTransactions(address: string, events: any[]) {
    // Agrupar transacciones por evento
    const eventTransactions = [];
    
    for (const event of events) {
      const eventDate = new Date(event.eventDate);
      const eventStart = eventDate.getTime();
      const eventEnd = eventStart + (24 * 60 * 60 * 1000); // 24 horas después
      const afterEventEnd = eventEnd + (7 * 24 * 60 * 60 * 1000); // 7 días después

      // Simular transacciones durante y después del evento
      eventTransactions.push({
        eventId: event.eventId,
        eventName: event.eventName,
        eventDate: event.eventDate,
        duringEvent: [], // Filtrar transacciones durante el evento
        afterEvent: [] // Filtrar transacciones después del evento
      });
    }

    return eventTransactions;
  }

  private calculateWalletMetrics(transactions: any[], eventTransactions: any[], events: any[]) {
    const totalTransactions = transactions.length;
    const totalValueTransferred = transactions.reduce((sum, tx) => 
      sum + parseFloat(Web3.utils.fromWei(tx.value, 'ether')), 0
    );

    const transactionsDuringEvents = eventTransactions.reduce((sum, group) => 
      sum + group.duringEvent.length, 0
    );

    const transactionsAfterEvents = eventTransactions.reduce((sum, group) => 
      sum + group.afterEvent.length, 0
    );

    const averageTransactionValue = totalTransactions > 0 ? 
      totalValueTransferred / totalTransactions : 0;

    // Calcular edad de la wallet (desde primera transacción)
    const oldestTransaction = transactions.reduce((oldest, tx) => 
      tx.timestamp < oldest.timestamp ? tx : oldest, transactions[0]
    );
    const walletAge = oldestTransaction ? 
      Math.floor((Date.now() - oldestTransaction.timestamp) / (24 * 60 * 60 * 1000)) : 0;

    // Score de actividad simple
    const activityScore = Math.min(100, 
      (totalTransactions * 2) + 
      (events.length * 10) + 
      (transactionsDuringEvents * 5)
    );

    return {
      totalTransactions,
      totalValueTransferred,
      eventsParticipated: events.length,
      transactionsDuringEvents,
      transactionsAfterEvents,
      averageTransactionValue,
      mostActiveEvent: events.length > 0 ? events[0].eventName : null,
      walletAge,
      activityScore
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
        found: !!userInfo || events > 0,
        userInfo,
        eventsCount: events
      };
    } catch (error) {
      console.error('Error searching wallet:', error);
      return {
        address,
        found: false,
        eventsCount: 0
      };
    }
  }
} 