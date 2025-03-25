import { prisma } from '../../prisma/client';
import { TypeErrorsEnum } from 'enum/TypeErrorsEnum';
import { ethers } from 'ethers';
import { MapService } from './MapService';
import { ReportService } from './ReportService';
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
const providerSocket = new ethers.providers.WebSocketProvider(process.env.BLOCKCHAIN_URL);
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

    private TPMWindowsKeys = new ethers.Wallet('0x39ab65b79478133e70fb3ba165f5530a15f34ee9726acd31590da7261aedfe15', provider);

    mapService = new MapService()
    reportService = new ReportService()
    private reportGeneratedListener: ((reportId: ethers.BigNumber, user: string, reportSoftwareBehavior: string[], violated: boolean) => void) | null = null;
    private debugLogListener: ((reportHash: string, messageHash: string, recoveredSigner: string, expectedSigner: string) => void) | null = null;


    private async sendTransaction(contractAddress: string, method: string, params: any[] = []):
        Promise<{ ok: boolean, message: string, data?: any }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, wallet);
            const nonce = await wallet.getTransactionCount();
            const gasPrice = await (await provider.getFeeData()).gasPrice;

            const transaction = await contract[method](...params, {
                gasLimit: 2000000,
                gasPrice: gasPrice,
                nonce: nonce,
            });

            const receipt = await transaction.wait();
            return { ok: true, message: `Transaction sent: ${receipt.transactionHash}` };
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

    async getReportOverview(contractAddress: string): Promise<{ ok: boolean, data: any }> {
        return this.callViewFunction(contractAddress, 'retrieveReportOverview');
    }

    async reportSoftwareBehavior(contractAddress: string, behavior: string[]): Promise<{ ok: boolean, message: string, data?: any }> {
        const behaviorBytes32 = behavior.map(b => ethers.utils.formatBytes32String(b));
        // Gera o hash que precisa ser assinado
        const reportHash = ethers.utils.keccak256(
          ethers.utils.solidityPack(["bytes32[]"], [behaviorBytes32])
        );
        const signature = await this.TPMWindowsKeys.signMessage(reportHash);
        const signatureHex = ethers.utils.hexlify(signature); // Converte para string hexadecimal
        console.log('Signature in Hex:', signatureHex);

         // Converte a assinatura para bytes
        const signatureBytes = ethers.utils.arrayify(signatureHex); 

        // Verifica o assinante diretamente
        const recoveredSigner = ethers.utils.verifyMessage(reportHash, signature);
        console.log('Recovered Signer:', recoveredSigner);
        console.log('ReportHash', reportHash)
        console.log('Signature', signature)
        return this.sendTransaction(contractAddress, 'generateReport', [behaviorBytes32, signatureHex]);
    }
        
    async listenDebug(contractAddress: string,){
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        
        // Definindo o listener para capturar o evento DebugLog
        this.debugLogListener = async (reportHash: string, messageHash: string, recoveredSigner: string, expectedSigner: string) => {
            console.log("📌 DebugLog Event Captured:");
            console.log("Report Hash:", reportHash);
            console.log("Message Hash:", messageHash);
            console.log("Recovered Signer:", recoveredSigner);
            console.log("Expected Signer:", expectedSigner);
        };
    
        // Adicionando o listener
        contract.on("DebugLog", this.debugLogListener);
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
        this.mapService.update(contractAddress, { last_block_report: latestBlock });
    }

    stopListeningForReportGenerated(contractAddress: string) {
        if (this.reportGeneratedListener) {
            const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
            contract.off('ReportGenerated', this.reportGeneratedListener);
            this.reportGeneratedListener = null;
        }
    }

}