import React, {
  useState,
  useEffect,
  createContext,
  useContext
} from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const Adminfetch = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAdmin(res.data);
    } catch (error) {
      console.log("Auth fetch error:", error.response?.data?.message);
      localStorage.removeItem("token");
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Adminfetch();
  }, []);

  const values = {
    admin,
    loading,
    Adminfetch,
  };

  return (
    <AuthContext.Provider value={values}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
