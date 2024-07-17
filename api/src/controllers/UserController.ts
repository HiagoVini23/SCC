/*import { Request, Response } from 'express';
import { getStatusResponseError } from '../utils/ErrorsHandling';
import { UserService } from '../services/UserService';
import { PokemonService } from 'services/PokemonService';
import { Pokemon } from 'models/Pokemon';
const userService = new UserService();
const pokemonService = new PokemonService();
const jwt = require("jsonwebtoken");

export class UserController {
    async createUser(req: Request, res: Response) {
        const response = await userService.create(req.body);
        if (response.ok)
            return res.status(200).send(response)
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }

    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const response = await userService.findToLogin(email, password);
        if (response.ok) {
            const payload = {
                userEmail: email,
                expiresIn: 10800, // expires in 3h
            }
            const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
            return res.status(200).json({
                token: token,
                data: response.data
            });
        }
        const status = getStatusResponseError(response)
        return res.status(status).json({ message: "Login failed!" });
    }

    async favPokemon(req: Request, res: Response) {
        const { idUser, idPokemon } = req.params;
        const pokemon = (await pokemonService.findById(Number(idPokemon))).data as Pokemon
        await pokemonService.createIfNotExist(pokemon)
        const response = await userService.createFavPokemon(Number(idUser), Number(idPokemon))
        if (response.ok)
            return res.status(200).send(response)
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }

    async unFavPokemon(req: Request, res: Response) {
        const { idUser, idPokemon } = req.params;
        const response = await userService.deleteFavPokemon(Number(idUser), Number(idPokemon))
        if (response.ok)
            return res.status(200).send(response)
        else {
            const status = getStatusResponseError(response)
            return res.status(status).send(response)
        }
    }
}
*/