import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';

const walletService = new WalletService();

export const getWalletInfo = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    // Validar formato de dirección
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    const walletInfo = await walletService.getWalletInfo(address);
    
    res.status(200).json({
      success: true,
      data: walletInfo
    });
  } catch (error) {
    console.error('Error getting wallet info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving wallet information'
    });
  }
};

export const searchWallet = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    const searchResult = await walletService.searchWallet(address);
    
    res.status(200).json({
      success: true,
      data: searchResult
    });
  } catch (error) {
    console.error('Error searching wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching wallet'
    });
  }
}; 