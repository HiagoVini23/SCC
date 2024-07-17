import { prisma } from '../../prisma/client';
import { TypeErrorsEnum } from 'enum/TypeErrorsEnum';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_WALLET || '0xf3ba133dc6b28a7976db03677a621efd3ecc38c07f93f963e98aa71f4b654c84', provider);
const contractABI = require('../SCC.json');

export class ContractService {

    async registerKey(keyBytes: string, contractAddress: string): Promise<{ ok: boolean, message: string }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, wallet);
            const nonce = await wallet.getNonce();
            const gasPrice = await (await provider.getFeeData()).gasPrice

            const transaction = await contract.registerKey(keyBytes, {
                gasLimit: 2000000,
                gasPrice: gasPrice,
                nonce: nonce,
            });

            const receipt = await transaction.wait();
            return { ok: true, message: `Transaction sent: ${receipt.hash}` };
        } catch (error) {
            console.error(`Erro ao enviar transação: ${error}`);
            return { ok: false, message: "Internal error!" };
        }
    }

    async authorizeUser(keyBytes: string, contractAddress: string): Promise<{ ok: boolean, message: string }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, wallet);
            const nonce = await wallet.getNonce();
            const gasPrice = await (await provider.getFeeData()).gasPrice

            const transaction = await contract.authorizeUser(keyBytes, {
                gasLimit: 2000000,
                gasPrice: gasPrice,
                nonce: nonce,
            });

            const receipt = await transaction.wait();
            return { ok: true, message: `Transaction sent: ${receipt.hash}` };
        } catch (error) {
            console.error(`Erro ao enviar transação: ${error}`);
            return { ok: false, message: "Internal error!" };
        }
    }
}
