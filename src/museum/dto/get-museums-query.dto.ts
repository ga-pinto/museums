import { MuseumEntity } from '../museum.entity';

export interface MuseumsQueryOptions {
  city?: string;
  name?: string;
  foundedBefore?: number | string;
  page?: number | string;
  limit?: number | string;
}

export interface PaginatedMuseums {
  data: MuseumEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
