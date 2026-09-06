import { useProfileContext } from '../context/ProfileContext';

export const useProfile = () => {
  return useProfileContext();
};
