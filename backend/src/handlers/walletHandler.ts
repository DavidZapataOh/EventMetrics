import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/walletService';

const walletService = new WalletService();

export const getWalletInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address } = req.params;
    
    if (!address) {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
      return;
    }

    const walletInfo = await walletService.getWalletInfo(address);
    
    res.status(200).json({
      success: true,
      data: walletInfo
    });
  } catch (error) {
    next(error);
  }
};

export const searchWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
      return;
    }

    const searchResult = await walletService.searchWallet(address);
    
    res.status(200).json({
      success: true,
      data: searchResult
    });
  } catch (error) {
    next(error);
  }
}; 