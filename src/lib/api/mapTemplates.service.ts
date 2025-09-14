import { api } from './http';

export type MapTemplate = { id: number; NAME: string };

export const mapTemplatesService = {
  list: () => api.get<{ maps: MapTemplate[] }>(`/api/map-templates`),
};
