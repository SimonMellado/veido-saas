import { useState } from "react";

const API = process.env.REACT_APP_API;

function Login() {
  const login = () => {
    window.location.href = `${API}/auth/login`;
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Nexora Dashboard</h1>
      <button onClick={login}>Login con Discord</button>
    </div>
  );
}

export default Login;