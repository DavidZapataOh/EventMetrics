import * as web3Service from '../services/web3Service';

const validateAddress = (req: any, res: any) => {
    try {
        const { address } = req.params;
        const isValid = web3Service.validateAddress(address);
        res.status(200).json({ isValid });
    } catch (error) {
        res.status(500).json({ message: 'Error validating address' });
    }
}   

const getWalletTransactions = async (req: any, res: any) => {
    try {
        const { address } = req.params;
        const { fromBlock, toBlock } = req.query;
        const transactions = await web3Service.getWalletTransactions(address, fromBlock || 'latest', toBlock || 'latest');
        res.status(200).json({ address, transactions });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallet transactions' });
    }
}

const getTransactionCount = async (req: any, res: any) => {
    try {
        const { address } = req.params;
        const transactionCount = await web3Service.getTransactionCount(address);
        res.status(200).json({ address, transactionCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transaction count' });
    }
}   

const getWalletBalance = async (req: any, res: any) => {
    try {
        const { address } = req.params;
        const balance = await web3Service.getWalletBalance(address);
        res.status(200).json({ address, balance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallet balance' });
    }
}

const verifyTransaction = async (req: any, res: any) => {
    try {
        const { txHash } = req.params;
        const verification = await web3Service.verifyTransaction(txHash);
        res.status(200).json({ txHash, verification });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying transaction' });
    }
}

export { validateAddress, getWalletTransactions, getTransactionCount, getWalletBalance, verifyTransaction };
