import { prisma } from '../../prisma/client';
import { TypeCapability, TypeErrorsEnum } from 'enum/TypeEnum';
import { ethers } from 'ethers';
import { MapService } from './MapService';
import { ReportService } from './ReportService';
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_URL);
const providerSocket = new ethers.providers.WebSocketProvider(process.env.BLOCKCHAIN_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_WALLET, provider);
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
    private capabilityViolatedListener: ((user: string, reportSoftwareBehavior: string) => void) | null = null;
   
    private async sendTransaction(contractAddress: string, method: string, params: any[] = []):
        Promise<{ ok: boolean, message: string, data?: any }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, wallet);
            const nonce = await wallet.getTransactionCount();
            const highGas = ethers.utils.parseUnits("10", "gwei")

            const transaction = await contract[method](...params, {
                gasLimit: 2000000,
                gasPrice: highGas,        
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

    async reportSoftwareBehavior(contractAddress: string, behavior: string[]): Promise<{ ok: boolean, message: string, failed?: string[] }> {
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, provider);
            const failedReports: string[] = [];
    
            for (const item of behavior) {
                const behaviorBytes32 = ethers.utils.formatBytes32String(item);
                const logs = await contract.queryFilter(
                    contract.filters.CapabilityFoundByUser(wallet.address, behaviorBytes32),
                    0,
                    'latest'
                );
    
                // Se o comportamento ainda não foi reportado
                if (logs.length === 0) {
                    try {
                        const reportHash = ethers.utils.keccak256(
                            ethers.utils.defaultAbiCoder.encode(["bytes32"], [behaviorBytes32])
                        );
                        const signature = await this.TPMWindowsKeys.signMessage(reportHash);
    
                        const tx = await this.sendTransaction(contractAddress, 'reportCapability', [behaviorBytes32, signature]);
                        
                        if (!tx) {
                            failedReports.push(item);
                        }
                    } catch (error) {
                        console.error(`Erro ao reportar comportamento ${item}:`, error);
                        failedReports.push(item);
                    }
                } else {
                    console.log(`Comportamento ${item} já foi reportado.`);
                }
            }
    
            if (failedReports.length > 0) {
                return { ok: false, message: "Alguns comportamentos falharam ao serem reportados.", failed: failedReports };
            }
    
            return { ok: true, message: "Todos os comportamentos foram reportados com sucesso." };
    
        } catch (error) {
            console.error("Erro ao reportar software behavior:", error);
            return { ok: false, message: "Erro inesperado ao reportar software behavior." };
        }
    }
    
        
    //*************EVENTS******************
    async listenForCapabilityViolated(contractAddress: string) {
        const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
        const mapContract = await this.mapService.findByContract(contractAddress);

        this.capabilityViolatedListener = async (user: string, softwareBehavior: string) => {
            const currentBlock = await providerSocket.getBlockNumber();
            if(wallet.address !== user){
                //@ts-ignore
                this.reportService.create(mapContract.data.id_software, softwareBehavior, TypeCapability.ExternViolated);
            }else{
                //@ts-ignore
                this.reportService.create(mapContract.data.id_software, softwareBehavior, TypeCapability.SelfViolated);
            }
            this.mapService.update(contractAddress, { last_block_report: currentBlock })
        };
        contract.on('CapabilityViolated', this.capabilityViolatedListener);
    }

    async fetchCapabilities(contractAddress: string, fromBlock: number) {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const logs = await contract.queryFilter('CapabilityViolated', fromBlock, 'latest');
        const mapContract = await this.mapService.findByContract(contractAddress);
        let latestBlock = fromBlock;
        for (const log of logs) {
            const { args, blockNumber } = log;
            const { user, softwareBehavior } = args;
            if (blockNumber > latestBlock) latestBlock = blockNumber;
            if(wallet.address !== user){
                //@ts-ignore
                this.reportService.create(mapContract.data.id_software, softwareBehavior, TypeCapability.ExternViolated);
            }
        }
        this.mapService.update(contractAddress, { last_block_report: latestBlock });
    }

    stopListeningForCapabilityViolated(contractAddress: string) {
        if (this.capabilityViolatedListener) {
            const contract = new ethers.Contract(contractAddress, contractABI, providerSocket);
            contract.off('CapabilityViolated', this.capabilityViolatedListener);
            this.capabilityViolatedListener = null;
        }
    }


    // async reportSoftwareBehavior(contractAddress: string, behavior: string[]): Promise<{ ok: boolean, message: string, data?: any }> {
    //     const behaviorBytes32 = behavior.map(b => ethers.utils.formatBytes32String(b));
    //     // Gera o hash que precisa ser assinado
    //     // const reportHash = ethers.utils.keccak256(
    //     //     ethers.utils.solidityPack(
    //     //         Array(behaviorBytes32.length).fill("bytes32"), 
    //     //         behaviorBytes32
    //     //     )            
    //     // );
    //     const reportHash = ethers.utils.keccak256(
    //         ethers.utils.defaultAbiCoder.encode(["bytes32[]"], [behaviorBytes32])
    //     );

    //     // const prefixedHash = ethers.utils.keccak256(
    //     //     ethers.utils.concat([ethers.utils.toUtf8Bytes("\x19Ethereum Signed Message:\n32"), reportHash])
    //     // );
        
    //     const signature = await this.TPMWindowsKeys.signMessage(reportHash);

    //     // Verifica o assinante diretamente
    //     const recoveredSigner = ethers.utils.verifyMessage(reportHash, signature);

    //     return this.sendTransaction(contractAddress, 'generateReport', [behaviorBytes32, signature]);
    // }

}