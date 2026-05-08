import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Guild from "./pages/Guild";

const API = process.env.REACT_APP_API;

function App() {
  const [user, setUser] = useState(undefined);

  const fetchUser = useCallback(async (retries = 3) => {
    if (!API) {
      console.error("❌ REACT_APP_API no está definida");
      setUser(null);
      return;
    }

    // PASO 1: Leer usuario desde ?user= en la URL (viene del redirect OAuth)
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");

    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        if (userData && userData.id) {
          console.log("✅ Usuario recibido desde URL:", userData.username);
          // Guardar token en localStorage para usarlo en peticiones
          if (userData.token) {
            localStorage.setItem("discord_token", userData.token);
          }
          const { token, ...userWithoutToken } = userData;
          setUser(userWithoutToken);
          window.history.replaceState({}, "", "/dashboard");
          return;
        }
      } catch (e) {
        console.error("❌ Error parseando user param:", e);
      }
    }

    // PASO 2: Intentar recuperar desde localStorage
    const savedToken = localStorage.getItem("discord_token");
    if (savedToken) {
      try {
        console.log("🔍 Verificando token guardado...");
        const res = await fetch(`${API}/user`, {
          credentials: "include",
          headers: { "Authorization": `Bearer ${savedToken}` }
        });
        const data = await res.json();
        if (data && data.id) {
          console.log("✅ Sesión recuperada:", data.username);
          setUser(data);
          return;
        }
      } catch (e) {
        console.error("❌ Token guardado inválido");
        localStorage.removeItem("discord_token");
      }
    }

    // PASO 3: Consultar /user normalmente
    try {
      console.log("🔍 Consultando sesión en API...");
      const res = await fetch(`${API}/user`, { credentials: "include" });
      const data = await res.json();

      if (data && data.id) {
        setUser(data);
      } else if (retries > 0) {
        setTimeout(() => fetchUser(retries - 1), 800);
      } else {
        setUser(null);
      }
    } catch {
      if (retries > 0) {
        setTimeout(() => fetchUser(retries - 1), 800);
      } else {
        setUser(null);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSetUser = (userData) => {
    if (!userData) {
      localStorage.removeItem("discord_token");
    }
    setUser(userData);
  };

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={user
            ? <Dashboard user={user} setUser={handleSetUser} />
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/guild/:id"
          element={user
            ? <Guild setUser={handleSetUser} />
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;