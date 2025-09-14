import { api } from './http';

export type SubTask = {
  id: number;
  task_main_id: number;
  NAME: string;
  max_count: number;
  notify: string;
  npc_id: number;
  map: number;
};

export type SubTasksResponse = {
  subTasks: SubTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const subTasksService = {
  list: (params: { task_main_id?: number; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.task_main_id != null) q.set('task_main_id', String(params.task_main_id));
    q.set('page', String(params.page ?? 1));
    q.set('limit', String(params.limit ?? 20));
    return api.get<SubTasksResponse>(`/api/task-sub-templates?${q.toString()}`);
  },
  get: (id: number) => api.get<SubTask>(`/api/task-sub-templates/${id}`),
  create: (payload: Partial<SubTask> & { task_main_id: number; NAME: string; map: number }) => api.post<SubTask>(`/api/task-sub-templates`, payload),
  update: (id: number, payload: Partial<SubTask>) => api.put<SubTask>(`/api/task-sub-templates/${id}`, payload),
  remove: (id: number) => api.delete(`/api/task-sub-templates/${id}`),
};
