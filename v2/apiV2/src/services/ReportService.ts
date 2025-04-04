import { prisma } from '../../prisma/client';
import { TypeErrorsEnum } from 'enum/TypeErrorsEnum';
import { Report } from '@prisma/client';

export class ReportService {
   
    async create(reportId: number, id_software: number, behaviors: string[]) {
        try {
            const createdReport = await prisma.report.create({
                data: {
                  id: reportId,
                  mapId: id_software,
                  behaviors: {
                    create: behaviors.map(description => ({
                        description: description
                    }))
                }}
              });
            return { ok: true, message: "Created successfully!", data: createdReport };
        } catch (error: any) {
            console.log(error)
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async findAll(id_software: number){
        try {
            const reportsFromSoftware = await prisma.report.findMany({
                where:{
                    mapId: id_software                    
                }});
            return { ok: true, message: "Found successfully!", data: reportsFromSoftware };
        } catch (error: any) {
            console.log(error)
            return { ok: false, message: "Internal error!", data: TypeErrorsEnum.Internal };
        }
    }

    async deleteMany(ids: number[]){
        try{
            const reportsDeleted = await prisma.report.deleteMany({
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