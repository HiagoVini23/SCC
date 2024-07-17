/*import { Request, Response } from 'express';
import { PokemonService } from '../services/PokemonService';
const pokemonService = new PokemonService();
import { getStatusResponseError } from '../utils/ErrorsHandling';
import { Pokemon } from 'models/Pokemon';

export class PokemonController {

    async findAllWithFavorites(req: Request, res: Response) {
        const { search='', limit, offset } = req.query;
        const { idUser } = req.params;
        let response = await pokemonService.findAll(String(search), Number(limit), Number(offset));
        const responseFav = await pokemonService.findFavsByUser(Number(idUser))
        if (response.ok && responseFav.ok){
            //@ts-ignore
            response.data  = response.data.map((pokemon: Pokemon) => ({
                ...pokemon,
                //@ts-ignore
                favorite: responseFav.data.includes(pokemon.id)
            }));
            return res.status(200).send(response)
        }
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }

    async findById(req: Request, res: Response) {
        const response = await pokemonService.findById(Number(req.params.id));
        if (response.ok)
            return res.status(200).send(response)
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }
}*/