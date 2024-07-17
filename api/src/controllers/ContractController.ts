import { Request, Response } from 'express';
import { MapService } from '../services/MapService';
import { ContractService } from '../services/ContractService';
import { getStatusResponseError } from '../utils/ErrorsHandling';
const mapService = new MapService();
const contractService = new ContractService();

export class ContractController {

    async registerKey(req: Request, res: Response) {
        const { key, contractAdress } = req.body
        const response = await contractService.registerKey(key, contractAdress);
        if (response.ok)
            return res.status(200).send(response)
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }

    async installation(req: Request, res: Response) {
        const { key, contractAddress } = req.body
        const mapResponse = await mapService.create(Number(req.params.id), contractAddress);
        if (!mapResponse.ok) {
            const status = getStatusResponseError(mapResponse);
            return res.status(status).send(mapResponse);
        }
        const contractResponse = await contractService.authorizeUser(key, contractAddress);
        if (contractResponse.ok)
            return res.status(200).send(contractResponse)
        else {
            const status = getStatusResponseError(contractResponse)
            return res.status(status).send(contractResponse)
        }
    }
}
