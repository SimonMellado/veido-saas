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
      console.error("REACT_APP_API no está definida");
      setUser(null);
      return;
    }

    try {
      const res = await fetch(`${API}/user`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

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
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />}
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