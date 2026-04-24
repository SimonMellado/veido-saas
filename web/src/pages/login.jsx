function Login() {
  const API = "https://veido-saas.onrender.com";

  window.location.href = `${API}/auth/login`;
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Nexora Dashboard</h1>
      <button onClick={login}>Login con Discord</button>
    </div>
  );

export default Login;