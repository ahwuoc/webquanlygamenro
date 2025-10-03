import { api } from './http';

export type ItemOptionTemplate = {
  id: number;
  NAME: string;
};

export type PaginatedItemOptions = {
  data: ItemOptionTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const itemOptionTemplatesService = {
  list: (page = 1, limit = 10, search = '') => 
    api.get<PaginatedItemOptions>(`/api/item-options?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  
  create: (payload: { id: number; NAME: string }) => 
    api.post<ItemOptionTemplate>(`/api/item-options`, payload),
  
  update: (id: number, payload: { NAME: string }) => 
    api.put<ItemOptionTemplate>(`/api/item-options/${id}`, payload),
  
  remove: (id: number) => 
    api.delete(`/api/item-options/${id}`),
  
  get: (id: number) => 
    api.get<ItemOptionTemplate>(`/api/item-options/${id}`),
  
  // For dropdown/select usage (returns all without pagination)
  getAll: () => 
    api.get<ItemOptionTemplate[]>(`/api/item-options?limit=all`),
};
