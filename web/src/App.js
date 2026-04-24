import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API || "https://veido-saas.onrender.com";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API}/user`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = () => {
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