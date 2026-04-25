import { useEffect, useState } from "react";
import "./App.css";

const API = process.env.REACT_APP_API;

function App() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [messages, setMessages] = useState([]);

  // LOGIN
  const login = () => {
    window.location.href = `${API}/auth/login`;
  };

  // USER + GUILDS
  useEffect(() => {
    const load = async () => {
      try {
        const resUser = await fetch(`${API}/user`, {
          credentials: "include"
        });

        const userData = await resUser.json();
        setUser(userData);

        if (userData?.username) {
          const resGuilds = await fetch(`${API}/guilds`, {
            credentials: "include"
          });

          const guildData = await resGuilds.json();
          setGuilds(guildData || []);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    load();
  }, []);

  // MESSAGES (FIX)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/messages`)
        .then(res => res.json())
        .then(setMessages)
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div>
        <h1>Veido Dashboard</h1>
        <button onClick={login}>Login Discord</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Hola {user.username}</h1>

      <h2>Servidores</h2>
      {guilds.map(g => (
        <p key={g.id}>{g.name}</p>
      ))}

      <h2>Actividad</h2>
      {messages.map((m, i) => (
        <p key={i}>{m.content}</p>
      ))}
    </div>
  );
}

export default App;

console.log("API:", API);