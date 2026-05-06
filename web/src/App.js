import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Guild from "./pages/Guild";

const API = process.env.REACT_APP_API;

function App() {
  const [user, setUser] = useState(undefined); // undefined = cargando, null = no autenticado

  useEffect(() => {
    if (!API) {
      console.error("REACT_APP_API no está definida en .env");
      setUser(null);
      return;
    }

    fetch(`${API}/user`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data || null))
      .catch(() => setUser(null));
  }, []);

  // Pantalla de carga inicial
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
        {/* Si no hay usuario, siempre va a login */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/guild/:id"
          element={user ? <Guild /> : <Navigate to="/login" replace />}
        />

        {/* Ruta raíz */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* 404 */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
