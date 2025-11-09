import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuseumEntity } from './museum.entity';
import { MuseumService } from './museum.service';
import { MuseumController } from './museum.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MuseumEntity])],
  controllers: [MuseumController],
  providers: [MuseumService],
  exports: [MuseumService],
})
export class MuseumModule {}
