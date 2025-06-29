"use client";

import React, { useState } from 'react';
import { Search, Wallet, User, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallets } from '@/lib/hooks/use-wallets';
import { Spinner } from '@/components/ui/spinner';

interface WalletSearchProps {
  onWalletSelect: (address: string) => void;
}

export function WalletSearch({ onWalletSelect }: WalletSearchProps) {
  const [searchAddress, setSearchAddress] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { searchWallet } = useWallets();
  
  const { data: searchResult, isLoading, error } = searchWallet(hasSearched ? searchAddress : '');

  const handleSearch = () => {
    if (searchAddress.trim() && searchAddress.startsWith('0x') && searchAddress.length === 42) {
      setHasSearched(true);
    }
  };

  const isValidAddress = searchAddress.startsWith('0x') && searchAddress.length === 42;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-text">
          <Search className="w-5 h-5 mr-2" />
          Buscar Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            placeholder="0x..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            leftIcon={<Wallet className="w-4 h-4" />}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!isValidAddress || isLoading}
          >
            {isLoading ? <Spinner size="sm" /> : 'Buscar'}
          </Button>
        </div>
        
        {hasSearched && searchResult && (
          <div className="mt-4 space-y-2">
            <p className="font-mono text-sm">{searchResult.address}</p>
            {searchResult.found && (
              <Button
                onClick={() => onWalletSelect(searchResult.address)}
                className="w-full"
              >
                Ver análisis completo
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 