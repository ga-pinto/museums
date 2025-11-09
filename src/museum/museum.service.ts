/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessError, BusinessLogicException } from '../shared/errors/business-errors';
import { FindOptionsWhere, LessThan, Raw, Repository } from 'typeorm';
import { PaginatedMuseums, MuseumsQueryOptions } from './dto/get-museums-query.dto';
import { MuseumEntity } from './museum.entity';

@Injectable()
export class MuseumService {
    constructor(
        @InjectRepository(MuseumEntity)
        private readonly museumRepository: Repository<MuseumEntity>
    ){}

    async findAll(options: MuseumsQueryOptions = {}): Promise<PaginatedMuseums> {
        const page = this.normalizePositiveInt(options.page, 1);
        const limit = this.normalizePositiveInt(options.limit, 10);

        const where: FindOptionsWhere<MuseumEntity> = {};
        const normalizedCity = this.normalizeText(options.city);
        const normalizedName = this.normalizeText(options.name);
        const foundedBefore = this.toNumber(options.foundedBefore);

        if (normalizedCity) {
            where.city = Raw(alias => `LOWER(${alias}) LIKE :city`, { city: `%${normalizedCity}%` });
        }

        if (normalizedName) {
            where.name = Raw(alias => `LOWER(${alias}) LIKE :name`, { name: `%${normalizedName}%` });
        }

        if (typeof foundedBefore === 'number') {
            where.foundedBefore = LessThan(foundedBefore);
        }

        const [data, total] = await this.museumRepository.findAndCount({
            where,
            relations: ["artworks", "exhibitions"],
            skip: (page - 1) * limit,
            take: limit,
            order: { name: 'ASC' },
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }

    async findOne(id: string): Promise<MuseumEntity> {
        const museum = await this.museumRepository.findOne({where: {id}, relations: ["artworks", "exhibitions"] } );
        if (!museum)
          throw new BusinessLogicException("The museum with the given id was not found", BusinessError.NOT_FOUND);
    
        return museum;
    }
    
    async create(museum: MuseumEntity): Promise<MuseumEntity> {
        return await this.museumRepository.save(museum);
    }

    async update(id: string, museum: MuseumEntity): Promise<MuseumEntity> {
        const persistedMuseum = await this.museumRepository.findOne({where:{id}});
        if (!persistedMuseum)
          throw new BusinessLogicException("The museum with the given id was not found", BusinessError.NOT_FOUND);
        
        return await this.museumRepository.save({...persistedMuseum, ...museum});
    }

    async delete(id: string) {
        const museum = await this.museumRepository.findOne({where:{id}});
        if (!museum)
          throw new BusinessLogicException("The museum with the given id was not found", BusinessError.NOT_FOUND);
      
        await this.museumRepository.remove(museum);
    }

    private normalizePositiveInt(value: number | string | undefined, defaultValue: number): number {
        const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
        if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0) {
            return Math.floor(parsed);
        }
        return defaultValue;
    }

    private normalizeText(value?: string): string | undefined {
        if (!value) return undefined;
        const normalized = value.trim().toLowerCase();
        return normalized.length ? normalized : undefined;
    }

    private toNumber(value: number | string | undefined): number | undefined {
        if (value === null || value === undefined) return undefined;
        const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
        return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined;
    }
}
