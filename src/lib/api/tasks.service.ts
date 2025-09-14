import { api } from './http';

export type TaskMain = {
  id: number;
  NAME: string;
  detail: string;
};

export type Paginated<T> = {
  tasks: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const tasksService = {
  list: (page = 1, limit = 10) => api.get<Paginated<TaskMain>>(`/api/task-main-templates?page=${page}&limit=${limit}`),
  create: (payload: { id: number; NAME: string; detail: string }) => api.post<TaskMain>(`/api/task-main-templates`, payload),
  update: (id: number, payload: { NAME: string; detail: string }) => api.put<TaskMain>(`/api/task-main-templates/${id}`, payload),
  remove: (id: number) => api.delete(`/api/task-main-templates/${id}`),
  get: (id: number) => api.get<TaskMain>(`/api/task-main-templates/${id}`),
};
