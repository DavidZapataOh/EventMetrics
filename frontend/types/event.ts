export interface Attendee {
    name: string;
    email: string;
    walletAddress: string;
}
  
export interface Transaction {
    type: string;
    count: number;
    details: string;
}
  
export interface Marketing {
    channels: string[];
    campaign: string;
}
  
export interface VirtualMetrics {
    engagement: number;
    connectionTime: number;
    other?: Record<string, any>;
}
  
export interface Event {
    _id: string;
    name: string;
    description: string;
    date: string;
    type: 'in-person' | 'virtual' | 'hybrid';
    creator: string;
    logo: string;
    objectives: string[];
    kpis: string[];
    registeredAttendees: Attendee[];
    specialGuests: string[];
    confirmedAttendees: number;
    totalAttendees: number;
    attendeesWithCertificate: number;
    previosEventAttendees: number;
    newWallets: number;
    openedWalletAddresses: string[];
    transactionsDuringEvent: Transaction[];
    transactionsAfterEvent: number;
    totalCost: number;
    budgetSurplusDeficit: number;
    marketing: Marketing;
    virtualMetrics: VirtualMetrics;
    createdAt: string;
    updatedAt: string;
}
  
export interface EventFormData {
    name: string;
    description: string;
    date: string;
    type: 'in-person' | 'virtual' | 'hybrid';
    logo?: string;
    objectives: string[];
    kpis: string[];
    registeredAttendees?: Attendee[];
    specialGuests?: string[];
    confirmedAttendees?: number;
    totalAttendees?: number;
    attendeesWithCertificate?: number;
    previosEventAttendees?: number;
    newWallets?: number;
    openedWalletAddresses?: string[];
    transactionsDuringEvent?: Transaction[];
    transactionsAfterEvent?: number;
    totalCost?: number;
    budgetSurplusDeficit?: number;
    marketing?: {
      channels: string[];
      campaign: string;
    };
    virtualMetrics?: {
      engagement: number;
      connectionTime: number;
      other?: Record<string, any>;
    };
}