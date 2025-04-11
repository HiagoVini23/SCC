import { Request, Response } from 'express';
import { MapService } from '../services/MapService';
import { ContractService } from '../services/ContractService';
import { getStatusResponseError } from '../utils/ErrorsHandling';
import { TypeErrorsEnum } from 'enum/TypeEnum';
import path from 'path';
const mapService = new MapService();
const contractService = new ContractService();

interface MapData {
    id: number;
    path: string
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
        const { path } = req.body
        const mapResponse = await mapService.findByPath(path);
        let contractResponse = {ok: false};
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
        const { behavior, path } = req.body
        const mapResponse = await mapService.findByPath(path);
        let contractResponse = {ok: false};
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
    async startAllEventListeningForSoftware() {
        const map = await mapService.findAll()
        if (map.ok) {
            const data = map.data as MapData[];
            for (const d of data) {
                await contractService.fetchCapabilities(d.contract, d.last_block_report);
                contractService.listenForCapabilityViolated(d.contract);
            }
        }
    }

    async stopAllEventListeningForSoftware(req: Request, res: Response) {
        const {path} = req.body
        const map = await mapService.findByPath(path)
        if (map.ok) {
            const data = map.data as MapData;
            contractService.stopListeningForCapabilityViolated(data.contract);
            return res.status(200).send(map)
        }
        const status = getStatusResponseError(map);
        return res.status(status).send(map);
    }

    async installation(req: Request, res: Response) {
        const { key, contractAddress, path } = req.body
        const contractResponse = await contractService.authorizeUser(key, contractAddress);
        const existing_map = await mapService.findByPath(path)
        //@ts-ignore
        const last_block = existing_map.ok ? existing_map.data.last_block_report : 0
        if (contractResponse.ok) {
            if (!existing_map.ok) {
                const mapResponse = await mapService.create(path, contractAddress);
                if (!mapResponse.ok)
                    return res.status(500).send({ok: false})
            }
            await contractService.fetchCapabilities(contractAddress, last_block);
            contractService.listenForCapabilityViolated(contractAddress);
            return res.status(200).send(contractResponse)
        }
        const status = getStatusResponseError(contractResponse);
        return res.status(status).send(contractResponse);
    }

    async uninstallation(req: Request, res: Response) {
        const { path } = req.body
        const mapResponse = await mapService.findByPath(path);
        let contractResponse = { ok: false};
        if (mapResponse.ok) {
            //@ts-ignore
            contractResponse = await contractService.revokeUser(mapResponse.data.contract);
            if (contractResponse.ok) {
                await mapService.delete(path)
                return res.status(200).send(contractResponse)
            }
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }
}