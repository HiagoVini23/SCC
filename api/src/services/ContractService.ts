import { prisma } from '../../prisma/client';
import { TypeErrorsEnum } from 'enum/TypeErrorsEnum';
import { ethers } from 'ethers';
import { MapService } from './MapService';
import { ReportService } from './ReportService';
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
const providerSocket = new ethers.WebSocketProvider(process.env.BLOCKCHAIN_URL);
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

    private WindowsKeys: string[] = [
        "0x1234576890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0x1234576892abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0x1234576690abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    ];

    mapService = new MapService()
    reportService = new ReportService()
    private reportGeneratedListener: ethers.Listener | null = null;
    private pendingReportGeneratedListener: ethers.Listener | null = null;

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
            return { ok: true, message: `Transaction sent: ${receipt.hash}` };
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

    async voteOnPendingReport(contractAddress: string, windowsKey: string, pendingReportID: number): Promise<{ ok: boolean, message: string, data?: any }> {
        if (this.WindowsKeys.includes(windowsKey)) {
            return this.sendTransaction(contractAddress, 'voteOnPendingReport', [true, pendingReportID]);
        } else {
            return this.sendTransaction(contractAddress, 'voteOnPendingReport', [false, pendingReportID]);
        }
    }

    async reportPendingSoftwareBehavior(contractAddress: string, behavior: string[], windowsKey: string): Promise<{ ok: boolean, message: string, data?: any }> {
        return this.sendTransaction(contractAddress, 'reportPendingSoftwareBehavior', [behavior, windowsKey]);
    }

    async getReportOverview(contractAddress: string): Promise<{ ok: boolean, data: any }> {
        return this.callViewFunction(contractAddress, 'retrieveReportOverview');
    }

    async startListeningForAllEvents(contractAddress: string) {
        const map = await this.mapService.findByContract(contractAddress);
        //@ts-ignore
        await this.fetchPendingReport(contractAddress, map.data.last_block_report)
        this.listenForReportGenerated(contractAddress);
        //@ts-ignore
        await this.fetchPendingReport(contractAddress, map.data.last_block_pending_report)
        this.listenForPendingReportGenerated(contractAddress);
    }

    stopListeningForAllEvents(contractAddress: string) {
        this.stopListeningForReportGenerated(contractAddress);
        this.stopListeningForPendingReportGenerated(contractAddress);
    }

    //*************EVENTS******************
    async listenForReportGenerated(contractAddress: string) {
        const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
        const mapContract = await this.mapService.findByContract(contractAddress);

        this.reportGeneratedListener = async (reportId: ethers.BigNumber, user: string, reportSoftwareBehavior: string[], violated: boolean) => {
            const currentBlock = await providerSocket.getBlockNumber();
            //@ts-ignore
            if(violated) this.reportService.create(reportId, mapContract.data.id_software, reportSoftwareBehavior);
            this.mapService.update(contractAddress, { last_block_report: currentBlock })
        };
        contract.on('ReportGenerated', this.reportGeneratedListener);
    }

    listenForPendingReportGenerated(contractAddress: string) {
        const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
        this.pendingReportGeneratedListener = async (reportId: ethers.BigNumber, user: string, reportSoftwareBehavior: string[], windowsKey: string) => {
            this.voteOnPendingReport(contractAddress, windowsKey, reportId)
            const currentBlock = await providerSocket.getBlockNumber();
            this.mapService.update(contractAddress, { last_block_pending_report: currentBlock })
        };
        contract.on('pendingReportGenerated', this.pendingReportGeneratedListener);
    }

    async fetchPendingReport(contractAddress: string, fromBlock: number) {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const logs = await contract.queryFilter('pendingReportGenerated', fromBlock, 'latest');
        let latestBlock = fromBlock;
        for (const log of logs) {
            const { args, blockNumber } = log;
            const { reportId, windowsKey } = args;
            if (blockNumber > latestBlock) {
                latestBlock = blockNumber;
            }
            this.voteOnPendingReport(contractAddress, windowsKey, reportId)
        }
        this.mapService.update(contractAddress, { last_block_pending_report: latestBlock });
    }

    async fetchReport(contractAddress: string, fromBlock: number) {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const logs = await contract.queryFilter('ReportGenerated', fromBlock, 'latest');
        const mapContract = await this.mapService.findByContract(contractAddress);
        let latestBlock = fromBlock;
        for (const log of logs) {
            const { args, blockNumber } = log;
            const { reportId, violated, reportSoftwareBehavior } = args;
            if (blockNumber > latestBlock) latestBlock = blockNumber;
            //@ts-ignore
            if(violated) this.reportService.create(reportId, mapContract.data.id_software, reportSoftwareBehavior);
        }
        this.mapService.update(contractAddress, { last_block_pending_report: latestBlock });
    }

    stopListeningForReportGenerated(contractAddress: string) {
        if (this.reportGeneratedListener) {
            const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
            contract.off('ReportGenerated', this.reportGeneratedListener);
            this.reportGeneratedListener = null;
        }
    }

    stopListeningForPendingReportGenerated(contractAddress: string) {
        if (this.pendingReportGeneratedListener) {
            const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
            contract.off('pendingReportGenerated', this.pendingReportGeneratedListener);
            this.pendingReportGeneratedListener = null;
        }
    }

}