/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmTestingConfig } from '../shared/testing-utils/typeorm-testing-config';
import { MuseumEntity } from './museum.entity';
import { MuseumService } from './museum.service';
import { faker } from '@faker-js/faker';

describe('MuseumService', () => {
  let service: MuseumService;
  let repository: Repository<MuseumEntity>;
  let museumsList: MuseumEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...TypeOrmTestingConfig()],
      providers: [MuseumService],
    }).compile();

    service = module.get<MuseumService>(MuseumService);
    repository = module.get<Repository<MuseumEntity>>(getRepositoryToken(MuseumEntity));
    await seedDatabase();
  });

  const seedDatabase = async () => {
    await repository.clear();
    museumsList = [];
    const fixedMuseums = [
      {
        name: 'Museo del Oro',
        description: 'Colección de piezas de oro precolombino',
        address: 'Carrera 6 #15-88',
        city: 'Bogota',
        image: faker.image.url(),
        foundedBefore: 1939,
      },
      {
        name: 'Museo Nacional de Colombia',
        description: 'Recorrido por la historia del país',
        address: 'Carrera 7 #28-66',
        city: 'Bogota',
        image: faker.image.url(),
        foundedBefore: 1823,
      },
      {
        name: 'Museo de Antioquia',
        description: 'Colección de arte moderno',
        address: 'Carrera 52 #52-43',
        city: 'Medellin',
        image: faker.image.url(),
        foundedBefore: 1881,
      },
    ];

    for (const data of fixedMuseums) {
      const museum = await repository.save({
        ...data,
      });
      museumsList.push(museum);
    }

    while (museumsList.length < 15) {
      const index = museumsList.length + 1;
      const museum: MuseumEntity = await repository.save({
        name: `Test Museum ${index}`,
        description: faker.lorem.sentence(),
        address: `Test Address ${index}`,
        city: `City ${index}`,
        image: faker.image.url(),
        foundedBefore: 1950 + index,
      });
      museumsList.push(museum);
    }
  };
    
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should use default pagination when parameters are omitted', async () => {
    const result = await service.findAll();
    expect(result.total).toBe(museumsList.length);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.data).toHaveLength(Math.min(10, museumsList.length));
  });

  it('findAll should combine filters by city and name', async () => {
    const result = await service.findAll({ city: 'bogota', name: 'oro' });
    expect(result.total).toBe(1);
    expect(result.data[0].name).toContain('Oro');
    expect(result.data[0].city).toBe('Bogota');
  });

  it('findAll should filter by foundedBefore year', async () => {
    const result = await service.findAll({ foundedBefore: 1900 });
    expect(result.total).toBe(2);
    expect(result.data.every(museum => museum.foundedBefore < 1900)).toBeTruthy();
  });

  it('findAll should honor page and limit parameters', async () => {
    const firstPage = await service.findAll({ limit: 3, page: 1 });
    const secondPage = await service.findAll({ limit: 3, page: 2 });
    expect(firstPage.data).toHaveLength(3);
    expect(secondPage.data).toHaveLength(3);
    const firstIds = firstPage.data.map(m => m.id);
    secondPage.data.forEach(museum => expect(firstIds).not.toContain(museum.id));
    expect(secondPage.page).toBe(2);
    expect(secondPage.limit).toBe(3);
  });

  it('findAll should fall back to defaults for invalid paging values', async () => {
    const result = await service.findAll({ page: '0', limit: '-5' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('findOne should return a museum by id', async () => {
    const storedMuseum: MuseumEntity = museumsList[0];
    const museum: MuseumEntity = await service.findOne(storedMuseum.id);
    expect(museum).not.toBeNull();
    expect(museum.name).toEqual(storedMuseum.name);
    expect(museum.description).toEqual(storedMuseum.description);
    expect(museum.address).toEqual(storedMuseum.address);
    expect(museum.city).toEqual(storedMuseum.city);
    expect(museum.image).toEqual(storedMuseum.image);
    expect(museum.foundedBefore).toEqual(storedMuseum.foundedBefore);
  });

  it('findOne should throw an exception for an invalid museum', async () => {
    await expect(() => service.findOne('0')).rejects.toHaveProperty('message', 'The museum with the given id was not found');
  });

  it('create should return a new museum', async () => {
    const museum: MuseumEntity = {
      id: '',
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      image: faker.image.url(),
      foundedBefore: 1975,
      exhibitions: [],
      artworks: [],
    };

    const newMuseum: MuseumEntity = await service.create(museum);
    expect(newMuseum).not.toBeNull();

    const storedMuseum = await repository.findOne({ where: { id: newMuseum.id } });
    expect(storedMuseum).not.toBeNull();
    expect(storedMuseum!.name).toEqual(newMuseum.name);
    expect(storedMuseum!.description).toEqual(newMuseum.description);
    expect(storedMuseum!.address).toEqual(newMuseum.address);
    expect(storedMuseum!.city).toEqual(newMuseum.city);
    expect(storedMuseum!.image).toEqual(newMuseum.image);
    expect(storedMuseum!.foundedBefore).toEqual(newMuseum.foundedBefore);
  });

  it('update should modify a museum', async () => {
    const museum: MuseumEntity = museumsList[0];
    museum.name = 'New name';
    museum.address = 'New address';
  
    const updatedMuseum: MuseumEntity = await service.update(museum.id, museum);
    expect(updatedMuseum).not.toBeNull();
  
    const storedMuseum = await repository.findOne({ where: { id: museum.id } });
    expect(storedMuseum).not.toBeNull();
    expect(storedMuseum!.name).toEqual(museum.name);
    expect(storedMuseum!.address).toEqual(museum.address);
  });
 
  it('update should throw an exception for an invalid museum', async () => {
    let museum: MuseumEntity = museumsList[0];
    museum = {
      ...museum, name: 'New name', address: 'New address'
    };
    await expect(() => service.update('0', museum)).rejects.toHaveProperty('message', 'The museum with the given id was not found');
  });

  it('delete should remove a museum', async () => {
    const museum: MuseumEntity = museumsList[0];
    await service.delete(museum.id);
  
    const deletedMuseum = await repository.findOne({ where: { id: museum.id } });
    expect(deletedMuseum).toBeNull();
  });

  it('delete should throw an exception for an invalid museum', async () => {
    const museum: MuseumEntity = museumsList[0];
    await service.delete(museum.id);
    await expect(() => service.delete('0')).rejects.toHaveProperty('message', 'The museum with the given id was not found');
  });
 
});
