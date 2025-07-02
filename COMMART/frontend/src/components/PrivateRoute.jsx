import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null); // null: aún no sabemos

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/users", {
      credentials: "include", // NECESARIO para enviar cookie al backend
    })
      .then((res) => {
        if (res.ok) {
          setIsAuth(true); // autorizado
        } else {
          setIsAuth(false); // no autorizado
        }
      })
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Cargando...</div>; // espera confirmación

  return isAuth ? children : <Navigate to="/" />;
};

export default PrivateRoute;
