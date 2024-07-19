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

    async voteOnPendingReport(req: Request, res: Response) {
        const id_software = Number(req.params.id)
        const { approve, pendingReportID } = req.body
        const mapResponse = await mapService.findById(id_software);
        let contractResponse;
        if (mapResponse.ok){
            //@ts-ignore
            contractResponse = await contractService.voteOnPendingReport(mapResponse.data.contract, approve, pendingReportID);
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

    async installation(req: Request, res: Response) {
        const { key, contractAddress } = req.body
        const contractResponse = await contractService.authorizeUser(key, contractAddress);
        if (contractResponse.ok) {
            const mapResponse = await mapService.create(Number(req.params.id), contractAddress);
            if (mapResponse.ok)
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