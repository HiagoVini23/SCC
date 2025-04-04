import { prisma } from '../../prisma/client';
import { TypeErrorsEnum } from 'enum/TypeEnum';
import { Map } from '@prisma/client';

export class MapService {
   
    async create(id: number, contractAdress: string) {
        try {
            const createdMap = await prisma.map.create({ data: {id_software: id, contract: contractAdress, last_block_report: 0} })
            return { ok: true, message: "Created successfully!", data: createdMap };
        } catch (error: any) {
            console.log(error)
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async update(contractAddress: string, data: any) {
        try {
            const updatedMap = await prisma.map.update({
                where:{
                    contract: contractAddress
                },
                data: data 
            })
            return { ok: true, message: "Updated successfully!", data: updatedMap };
        } catch (error: any) {
            console.log(error)
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async findById(id: number) {
        try {
            const contractAdress = await prisma.map.findUnique({
                where: {
                    id_software: id
                },
            })
            if(contractAdress)
                return  { ok: true, message: "Found Succesfully!", data: contractAdress };
            return { ok: false, message: "Found Failed!", data: TypeErrorsEnum.NotFound};          
        } catch (error) {
            console.log(error);
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async findByContract(contract: string) {
        try {
            const contractAdress = await prisma.map.findUnique({
                where: {
                    contract: contract
                },
            })
            if(contractAdress)
                return  { ok: true, message: "Found Succesfully!", data: contractAdress };
            return { ok: false, message: "Found Failed!", data: TypeErrorsEnum.NotFound};          
        } catch (error) {
            console.log(error);
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async delete(id: number){
        try{
            const deleted = await prisma.map.delete({
                where:{
                   id_software: id
                }
            })
            return { ok: true, message: "Map deleted successfully!", data: deleted };
        }catch(error){
            console.log(error);
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

}