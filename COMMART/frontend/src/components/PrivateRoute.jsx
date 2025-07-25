import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null); 

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/users", {
      credentials: "include", // NECESARIO para enviar cookie al backend
    })
      .then((res) => {
        if (res.ok) {
          setIsAuth(true); // Autorizado
        } else {
          setIsAuth(false); // No autorizado
        }
      })
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Cargando...</div>; // Espera confirmación

  return isAuth ? children : <Navigate to="/" />;
};

export default PrivateRoute;
