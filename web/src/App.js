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

    // ✅ PASO 1: Leer usuario desde ?user= en la URL (viene del redirect OAuth)
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");

    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        if (userData && userData.id) {
          console.log("✅ Usuario recibido desde URL:", userData.username);
          setUser(userData);
          // Limpiar la URL sin recargar la página
          window.history.replaceState({}, "", "/dashboard");
          return;
        }
      } catch (e) {
        console.error("❌ Error parseando user param:", e);
      }
    }

    // ✅ PASO 2: Si no hay param en URL, consultar /user en la API
    try {
      console.log("🔍 Consultando sesión en API...");
      const res = await fetch(`${API}/user`, {
        credentials: "include"
      });

      const data = await res.json();
      console.log("📊 Respuesta /user:", data);

      if (data && data.id) {
        setUser(data);
      } else if (retries > 0) {
        console.log(`⏳ Reintentando... (${retries} intentos restantes)`);
        setTimeout(() => fetchUser(retries - 1), 800);
      } else {
        console.log("❌ No hay sesión activa");
        setUser(null);
      }
    } catch (err) {
      console.error("❌ Error consultando /user:", err);
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

  // Pantalla de carga mientras se verifica la sesión
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
            ? <Dashboard user={user} setUser={setUser} />
            : <Navigate to="/login" replace />}
        />
        <Route
          path="/guild/:id"
          element={user ? <Guild /> : <Navigate to="/login" replace />}
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