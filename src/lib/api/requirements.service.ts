import { api } from './http';

export type Requirement = {
  id: number;
  task_main_id: number;
  task_sub_id: number;
  requirement_type: string;
  target_id: number;
  target_count: number;
  map_restriction?: string | null;
  extra_data?: string | null;
  is_active: boolean;
};

export type RequirementsResponse = {
  requirements: Requirement[];
};

export const requirementsService = {
  list: (params: { task_main_id?: number; task_sub_id?: number; requirement_type?: string }) => {
    const q = new URLSearchParams();
    if (params.task_main_id != null) q.set('task_main_id', String(params.task_main_id));
    if (params.task_sub_id != null) q.set('task_sub_id', String(params.task_sub_id));
    if (params.requirement_type) q.set('requirement_type', params.requirement_type);
    return api.get<RequirementsResponse>(`/api/task-requirements?${q.toString()}`);
  },
  get: (id: number) => api.get<Requirement>(`/api/task-requirements/${id}`),
  create: (payload: Partial<Requirement> & { task_main_id: number; task_sub_id: number; requirement_type: string; target_id: number }) =>
    api.post<Requirement>(`/api/task-requirements`, payload),
  update: (id: number, payload: Partial<Requirement>) => api.put<Requirement>(`/api/task-requirements/${id}`, payload),
  remove: (id: number) => api.delete(`/api/task-requirements/${id}`),
};
