import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API;

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!API) {
      console.error("❌ REACT_APP_API no está definida");
      return;
    }

    fetch(`${API}/user`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = () => {
    if (!API) {
      alert("API no configurada");
      return;
    }

    window.location.href = `${API}/auth/login`;
  };

  if (!user) {
    return (
      <div>
        <h1>Veido Dashboard</h1>
        <button onClick={login}>Login Discord</button>
      </div>
    );
  }

  return <h1>Hola {user.username}</h1>;
}

export default App;

console.log("API ACTUAL:", API);