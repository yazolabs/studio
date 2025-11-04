import { api } from './api';

export type State = {
  id: number;
  name: string;
  uf: string;
};

export async function listStates() {
  const { data } = await api.get<State[]>('/states');
  return data;
}
