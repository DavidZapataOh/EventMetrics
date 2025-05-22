import Web3 from 'web3';

const web3 = new Web3(process.env.RPC_URL);

const validateAddress = (address: string) => {
    const isValid = web3.utils.isAddress(address);
    return isValid;
}

const getWalletTransactions = async (address: string, fromBlock: number, toBlock: number) => {
    try {
        if (!validateAddress(address)) {
            throw new Error('Invalid wallet address');
        }

        const history = await web3.eth.getPastLogs({
            fromBlock: fromBlock,
            toBlock: toBlock,
            address: address,
        });

        return history;
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        throw error;
    }
}

const getTransactionCount = async (address: string) => {
    try {
        const transactionCount = await web3.eth.getTransactionCount(address);
        return transactionCount;
    } catch (error) {
        console.error('Error fetching transaction count:', error);
        throw error;
    }
}

const getWalletBalance = async (address: string) => {
    try {
        if (!validateAddress(address)) {
            throw new Error('Invalid wallet address');
        }

        const balance = await web3.eth.getBalance(address);
        return web3.utils.fromWei(balance, 'ether');
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
}

const verifyTransaction = async (txHash: string) => {
    try {
        const tx = await web3.eth.getTransaction(txHash);
        if (!tx) {
            throw new Error('Transaction not found');
        }

        const receipt = await web3.eth.getTransactionReceipt(txHash);
        return {
            exists: true,
            confirmed: receipt !== null,
            from: tx.from,
            to: tx.to,
            value: web3.utils.fromWei(tx.value, 'ether'),
        };
    } catch (error) {
        console.error('Error verifying transaction:', error);
        throw error;
    }
}

export { validateAddress, getWalletTransactions, getTransactionCount, getWalletBalance, verifyTransaction };