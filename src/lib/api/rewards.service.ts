import { api } from './http';

export type Reward = {
  id: number;
  requirement_id?: number;
  task_main_id?: number;
  task_sub_id?: number;
  reward_type: string;
  reward_id: number;
  reward_quantity: string | number;
  reward_description?: string | null;
};

export type RewardsResponse = {
  rewards: Reward[];
};

export const rewardsService = {
  list: (params: { task_main_id?: number; task_sub_id?: number; reward_type?: string }) => {
    const q = new URLSearchParams();
    if (params.task_main_id != null) q.set('task_main_id', String(params.task_main_id));
    if (params.task_sub_id != null) q.set('task_sub_id', String(params.task_sub_id));
    if (params.reward_type) q.set('reward_type', params.reward_type);
    return api.get<RewardsResponse>(`/api/task-rewards?${q.toString()}`);
  },
  get: (id: number) => api.get<Reward>(`/api/task-rewards/${id}`),
  create: (payload: Partial<Reward> & ({ requirement_id: number } | { task_main_id: number; task_sub_id: number }) & { reward_type: string; reward_quantity: number | string }) =>
    api.post<Reward>(`/api/task-rewards`, payload),
  update: (id: number, payload: Partial<Reward>) => api.put<Reward>(`/api/task-rewards/${id}`, payload),
  remove: (id: number) => api.delete(`/api/task-rewards/${id}`),
};
