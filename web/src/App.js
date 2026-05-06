import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Guild from "./pages/Guild";
import "./App.css";

const API = process.env.REACT_APP_API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!API) {
      console.error("❌ REACT_APP_API no está definida");
      setLoading(false);
      return;
    }

    try {
      // Usamos 'include' para enviar la cookie de sesión desde Vercel
      const res = await fetch(`${API}/user`, { credentials: "include" });
      
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          setUser(data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("❌ Error al obtener usuario:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Pantalla de carga mientras se verifica la sesión en la API
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#0f0f0f"
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Si ya hay usuario, al ir a /login enviamos al dashboard */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login fetchUser={fetchUser} />} 
        />
        
        {/* Rutas protegidas: Si no hay usuario, enviar a /login */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/guild/:id" 
          element={user ? <Guild user={user} /> : <Navigate to="/login" replace />} 
        />
        
        {/* RUTA RAIZ: Decidir dinámicamente según estado de autenticación */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;