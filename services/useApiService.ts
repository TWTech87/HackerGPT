import { useCallback } from 'react';

import { useFetch } from '@/hooks/useFetch';

export interface GetModelsRequestProps {
  key: string;
}

const useApiService = () => {
  const fetchService = useFetch();

  // Return fixed models for now
  const getModels = useCallback(() => {
    return Promise.resolve([
      {
        id: 'gpt-3.5-turbo-instruct',
        name: 'HackerGPT',
      },
      {
        id: 'gpt-4',
        name: 'HackerGPT Pro',
      },
    ]);
  }, []);

  return {
    getModels,
  };
};

export default useApiService;
