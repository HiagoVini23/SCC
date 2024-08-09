import { Request, Response } from 'express';
import { MapService } from '../services/MapService';
import { ContractService } from '../services/ContractService';
import { getStatusResponseError } from '../utils/ErrorsHandling';
const mapService = new MapService();
const contractService = new ContractService();

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
        if (mapResponse.ok){
            //@ts-ignore
            contractResponse = await contractService.getReportOverview(mapResponse.data.contract);
            if (contractResponse.ok)
                return res.status(200).send(contractResponse)
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }

    async reportPendingSoftwareBehavior(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const { behavior, windowsKey } = req.body
        const mapResponse = await mapService.findById(id_software);
        let contractResponse;
        if (mapResponse.ok){
            //@ts-ignore
            contractResponse = await contractService.reportPendingSoftwareBehavior(mapResponse.data.contract, behavior, windowsKey);
            if (contractResponse.ok)
                return res.status(200).send(contractResponse)
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }

    async startEventListeningForSoftware(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const response = await mapService.findById(id_software)
        if(response.ok){
            //@ts-ignore
            await contractService.startListeningForAllEvents(response.data.contract)
            return res.status(200).send(response)
        }
        const status = getStatusResponseError(response);
        return res.status(status).send(response);
    }

    async stopEventListeningForSoftware(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const response = await mapService.findById(id_software)
        if(response.ok){
            //@ts-ignore
            contractService.stopListeningForAllEvents(response.data.contract)
            return res.status(200).send(response)
        }
        const status = getStatusResponseError(response);
        return res.status(status).send(response);
    }

    async installation(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const { key, contractAddress } = req.body
        const contractResponse = await contractService.authorizeUser(key, contractAddress);
        if (contractResponse.ok) {
            if(!(await mapService.findById(id_software)).ok){
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
            if (contractResponse.ok){
                await mapService.delete(id_software)
                return res.status(200).send(contractResponse)
            }
        }
        const status = getStatusResponseError(contractResponse)
        return res.status(status).send(contractResponse)
    }
}