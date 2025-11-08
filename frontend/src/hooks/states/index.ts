import { useQuery } from '@tanstack/react-query';
import { listStates } from '@/services/statesService';
import { queryKeys } from '@/services/api';

export function useStatesQuery() {
  return useQuery({
    queryKey: [queryKeys.states],
    queryFn: listStates,
  });
}
