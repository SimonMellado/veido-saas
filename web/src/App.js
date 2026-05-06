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
    try {
      // Importante: credentials: "include" es lo que envía la cookie al API
      const res = await fetch(`${API}/user`, { credentials: "include" });
      if (!res.ok) throw new Error("No autenticado");
      
      const data = await res.json();
      if (data?.id) {
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log("Sesión no iniciada o expirada");
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#0f0f0f" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login fetchUser={fetchUser} />} />
        
        <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" replace />} />
        
        <Route path="/guild/:id" element={user ? <Guild user={user} /> : <Navigate to="/login" replace />} />
        
        {/* Si no está logueado, enviar a login, si lo está, a dashboard */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;