import { prisma } from '../../prisma/client';
import { TypeCapability, TypeErrorsEnum } from 'enum/TypeEnum';
import { Capability } from '@prisma/client';

export class ReportService {
   
    async create(path: string, description: string, type: TypeCapability) {
        try {
            const createdCapability = await prisma.capability.create({
                data: {
                  mapPath: path,
                  type: type,
                  description: description
                }
              });
            return { ok: true, message: "Created successfully!", data: createdCapability };
        } catch (error: any) {
            console.log(error)
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async findAllByPath(path: string){
        try {
            const capabilities = await prisma.capability.findMany({
                where:{
                    mapPath: path                    
                }});
            return { ok: true, message: "Found successfully!", data: capabilities };
        } catch (error: any) {
            console.log(error)
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async deleteMany(ids: number[]){
        try{
            const reportsDeleted = await prisma.capability.deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            });
            return { ok: true, message: "Reports deleted successfully!", data: reportsDeleted };
        }catch(error){
            console.log(error);
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

}