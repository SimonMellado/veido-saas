import { useEffect } from "react";
import PropTypes from "prop-types";

const API = process.env.REACT_APP_API;

function Login({ fetchUser }) {
  const handleLogin = () => {
    if (!API) {
      console.error("REACT_APP_API no definida");
      return;
    }
    window.location.href = `${API}/auth/login`;
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-text">VEIDO</span>
        </div>
        <h1 className="login-title">Dashboard</h1>
        <p className="login-subtitle">
          Gestiona tu bot de Discord desde un solo lugar
        </p>
        <button className="btn-discord" onClick={handleLogin}>
          Iniciar sesión con Discord
        </button>
      </div>
    </div>
  );
}

Login.propTypes = {
  fetchUser: PropTypes.func.isRequired
};

export default Login;