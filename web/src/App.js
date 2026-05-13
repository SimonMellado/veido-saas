import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Guild from "./pages/Guild";

const API = process.env.REACT_APP_API;
const SESSION_KEY = "veido_user";
const TOKEN_KEY = "discord_token";

function App() {
  const [user, setUser] = useState(undefined);

  const fetchUser = useCallback(async (retries = 3) => {
    if (!API) { setUser(null); return; }

    // 1. Leer desde URL (viene del redirect OAuth)
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");
    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        if (userData?.id) {
          if (userData.token) localStorage.setItem(TOKEN_KEY, userData.token);
          const { token, ...userWithoutToken } = userData;
          // Guardar sesión en localStorage para no tener que loguearse siempre
          localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutToken));
          setUser(userWithoutToken);
          window.history.replaceState({}, "", "/dashboard");
          return;
        }
      } catch {}
    }

    // 2. Recuperar sesión guardada en localStorage
    const savedSession = localStorage.getItem(SESSION_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (savedSession && savedToken) {
      try {
        const userData = JSON.parse(savedSession);
        if (userData?.id) {
          // Verificar que el token sigue siendo válido
          const res = await fetch(`${API}/user`, {
            credentials: "include",
            headers: { "Authorization": `Bearer ${savedToken}` }
          });
          const data = await res.json();
          if (data?.id) {
            // Actualizar datos frescos del usuario
            localStorage.setItem(SESSION_KEY, JSON.stringify(data));
            setUser(data);
            return;
          } else {
            // Token expirado, usar datos guardados igualmente
            setUser(userData);
            return;
          }
        }
      } catch {
        // Si falla la verificación usar datos guardados
        try {
          const userData = JSON.parse(savedSession);
          if (userData?.id) { setUser(userData); return; }
        } catch {}
      }
    }

    // 3. Consultar API normalmente
    try {
      const res = await fetch(`${API}/user`, { credentials: "include" });
      const data = await res.json();
      if (data?.id) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data));
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

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleSetUser = (userData) => {
    if (!userData) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
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
          element={!user
            ? <Login fetchUser={fetchUser} />
            : <Navigate to="/dashboard" replace />}
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
            ? <Guild user={user} setUser={handleSetUser} />
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