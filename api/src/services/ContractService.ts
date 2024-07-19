import { prisma } from '../../prisma/client';
import { TypeErrorsEnum } from 'enum/TypeErrorsEnum';
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_WALLET || '0xf3ba133dc6b28a7976db03677a621efd3ecc38c07f93f963e98aa71f4b654c84', provider);
const contractABI = require('../SCC.json');

function bigIntToString(obj: any): any {
    if (typeof obj === 'bigint') {
        return obj.toString();
    } else if (Array.isArray(obj)) {
        return obj.map(bigIntToString);
    } else if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, bigIntToString(value)])
        );
    } else {
        return obj;
    }
}

export class ContractService {

    private async sendTransaction(contractAddress: string, method: string, params: any[] = []):
     Promise<{ ok: boolean, message: string, data?: any }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, wallet);
            const nonce = await wallet.getNonce();
            const gasPrice = await (await provider.getFeeData()).gasPrice;

            const transaction = await contract[method](...params, {
                gasLimit: 2000000,
                gasPrice: gasPrice,
                nonce: nonce,
            });

            const receipt = await transaction.wait();
            return { ok: true, message: `Transaction sent: ${receipt.hash}`};
        } catch (e) {
            console.error(`Error sending transaction: ${e}`);
            //@ts-ignore
            return { ok: false, message: "Internal error!", data: e };
        }
    }

    private async callViewFunction(contractAddress: string, method: string, params: any[] = []): Promise<{ ok: boolean, data: any }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, provider);
            const data = await contract[method](...params);
            return { ok: true, data: bigIntToString(data) };
        } catch (error) {
            console.error(`Error calling view function: ${error}`);
            return { ok: false, data: null };
        }
    }

    async registerKey(keyBytes: string, contractAddress: string): Promise<{ ok: boolean, message: string, data?: any }> {
        return this.sendTransaction(contractAddress, 'registerKey', [keyBytes]);
    }

    async authorizeUser(keyBytes: string, contractAddress: string): Promise<{ ok: boolean, message: string, data?: any }> {
        return this.sendTransaction(contractAddress, 'authorizeUser', [keyBytes]);
    }

    async revokeUser(contractAddress: string): Promise<{ ok: boolean, message: string, data?: any }> {
        return this.sendTransaction(contractAddress, 'revokeAuthorization');
    }

    async voteOnPendingReport(contractAddress: string, approve: boolean, pendingReportID: number): Promise<{ ok: boolean, message: string, data?: any }> {
        return this.sendTransaction(contractAddress, 'voteOnPendingReport', [approve, pendingReportID]);
    }

    async reportPendingSoftwareBehavior(contractAddress: string, behavior: string[], windowsKey: string): Promise<{ ok: boolean, message: string, data?: any }> {
        return this.sendTransaction(contractAddress, 'reportPendingSoftwareBehavior', [behavior, windowsKey]);
    }

    async getReportOverview(contractAddress: string): Promise<{ ok: boolean, data: any }> {
        return this.callViewFunction(contractAddress, 'retrieveReportOverview');
    }
}