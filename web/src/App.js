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
      console.log("🔍 Verificando sesión...");
      const res = await fetch(`${API}/user`, { credentials: "include" });
      const data = await res.json();
      
      if (data && data.id) {
        console.log("✅ Usuario autenticado:", data.username);
        setUser(data);
      } else {
        console.log("❌ No hay usuario autenticado");
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
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login fetchUser={fetchUser} />} 
        />
        
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/guild/:id" 
          element={user ? <Guild user={user} /> : <Navigate to="/login" replace />} 
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;