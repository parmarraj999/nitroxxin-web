import { useAuth as useAuthFromContext } from "../context/AuthContext";

/**
 * Custom hook to access authentication and auth modal states.
 */
export const useAuth = () => {
  return useAuthFromContext();
};

export default useAuth;
