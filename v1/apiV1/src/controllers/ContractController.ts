import { Request, Response } from 'express';
import { MapService } from '../services/MapService';
import { ContractService } from '../services/ContractService';
import { getStatusResponseError } from '../utils/ErrorsHandling';
import { TypeErrorsEnum } from 'enum/TypeEnum';
const mapService = new MapService();
const contractService = new ContractService();

interface MapData {
    id_software: number;
    contract: string;
    last_block_pending_report: number;
    last_block_report: number;
}

export class ContractController {

    async registerKey(req: Request, res: Response) {
        const { key, contractAddress } = req.body
        const response = await contractService.registerKey(key, contractAddress);
        if (response.ok)
            return res.status(200).send(response)
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }

    async getReportOverview(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const mapResponse = await mapService.findById(id_software);
        let contractResponse;
        if (mapResponse.ok) {
            //@ts-ignore
            contractResponse = await contractService.getReportOverview(mapResponse.data.contract);
            if (contractResponse.ok)
                return res.status(200).send(contractResponse)
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }

    async reportSoftwareBehavior(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const { behavior } = req.body
        const mapResponse = await mapService.findById(id_software);
        let contractResponse;
        if (mapResponse.ok) {
            //@ts-ignore
            contractResponse = await contractService.reportSoftwareBehavior(mapResponse.data.contract, behavior);
            if (contractResponse.ok)
                return res.status(200).send(contractResponse)
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }

    // listen todos, não precisa ser id, passa path e 
    // rodar ao iniciar
    async startAllEventListeningForSoftware(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const map = await mapService.findById(id_software)
        if (map.ok) {
            const data = map.data as MapData;
            await contractService.fetchCapabilities(data.contract, data.last_block_report)
            contractService.listenForCapabilityViolated(data.contract);
            return res.status(200).send(map)
        }
        const status = getStatusResponseError(map);
        return res.status(status).send(map);
    }

    async stopAllEventListeningForSoftware(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const map = await mapService.findById(id_software)
        if (map.ok) {
            const data = map.data as MapData;
            contractService.stopListeningForCapabilityViolated(data.contract);
            return res.status(200).send(map)
        }
        const status = getStatusResponseError(map);
        return res.status(status).send(map);
    }

    async installation(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const { key, contractAddress } = req.body
        const contractResponse = await contractService.authorizeUser(key, contractAddress);
        if (contractResponse.ok) {
            if (!(await mapService.findById(id_software)).ok) {
                const mapResponse = await mapService.create(id_software, contractAddress);
                if (mapResponse.ok)
                    return res.status(200).send(contractResponse)
            }
            return res.status(200).send(contractResponse)
        }
        const status = getStatusResponseError(contractResponse);
        return res.status(status).send(contractResponse);
    }

    async uninstallation(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const mapResponse = await mapService.findById(id_software);
        let contractResponse;
        if (mapResponse.ok) {
            //@ts-ignore
            contractResponse = await contractService.revokeUser(mapResponse.data.contract);
            if (contractResponse.ok) {
                await mapService.delete(id_software)
                return res.status(200).send(contractResponse)
            }
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }
}