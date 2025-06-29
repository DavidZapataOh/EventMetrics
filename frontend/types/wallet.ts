export interface WalletInfo {
  address: string;
  balance: {
    avax: number;
    usd: number;
  };
  transactions: WalletTransaction[];
  eventTransactions: EventTransactionGroup[];
  userInfo?: {
    name: string;
    email: string;
    userId: string;
  };
  events: WalletEventParticipation[];
  metrics: WalletMetrics;
}

export interface WalletTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  status: number;
  network: 'avalanche' | 'fuji';
}

export interface EventTransactionGroup {
  eventId: string;
  eventName: string;
  eventDate: string;
  duringEvent: WalletTransaction[];
  afterEvent: WalletTransaction[];
}

export interface WalletEventParticipation {
  eventId: string;
  eventName: string;
  eventDate: string;
  registeredDate: string;
  attended: boolean;
  walletCreatedDuringEvent: boolean;
}

export interface WalletMetrics {
  totalTransactions: number;
  totalValueTransferred: number;
  eventsParticipated: number;
  transactionsDuringEvents: number;
  transactionsAfterEvents: number;
  averageTransactionValue: number;
  mostActiveEvent: string | null;
  walletAge: number; // días desde primera transacción
  activityScore: number; // 0-100
}

export interface WalletSearchResult {
  address: string;
  found: boolean;
  userInfo?: {
    name: string;
    email: string;
  };
  eventsCount: number;
} 