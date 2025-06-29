"use client";

import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { PageHeader } from '@/components/shared/page-header';
import { WalletSearch } from '@/components/wallets/wallet-search';
import { WalletDetails } from '@/components/wallets/wallet-details';
import { useWallets } from '@/lib/hooks/use-wallets';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function WalletsPage() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { getWalletInfo } = useWallets();
  
  const { data: walletData, isLoading, error } = getWalletInfo(selectedWallet || '');

  const handleWalletSelect = (address: string) => {
    setSelectedWallet(address);
  };

  const handleBack = () => {
    setSelectedWallet(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Wallets", href: "/wallets" },
        ]}
      />
      
      <PageHeader 
        title="Análisis de Wallets" 
        subtitle="Busca y analiza el comportamiento de wallets en la blockchain de Avalanche"
      />

      {!selectedWallet ? (
        <WalletSearch onWalletSelect={handleWalletSelect} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a búsqueda
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-textSecondary">Analizando wallet...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-error mb-4">Error al cargar la información de la wallet</p>
              <Button onClick={handleBack} variant="outline">
                Intentar con otra wallet
              </Button>
            </div>
          )}

          {walletData && !isLoading && (
            <WalletDetails wallet={walletData} />
          )}
        </div>
      )}
    </div>
  );
} 