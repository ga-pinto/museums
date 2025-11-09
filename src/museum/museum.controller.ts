import { Controller, Get, Query } from '@nestjs/common';
import { PaginatedMuseums } from './dto/get-museums-query.dto';
import { MuseumService } from './museum.service';

@Controller('museums')
export class MuseumController {
  constructor(private readonly museumService: MuseumService) {}

  @Get()
  async getMuseums(
    @Query('city') city?: string,
    @Query('name') name?: string,
    @Query('foundedBefore') foundedBefore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedMuseums> {
    return this.museumService.findAll({
      city,
      name,
      foundedBefore,
      page,
      limit,
    });
  }
}
