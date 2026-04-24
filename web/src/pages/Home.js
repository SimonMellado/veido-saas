import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [guilds, setGuilds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/guilds")
      .then(res => res.json())
      .then(setGuilds);
  }, []);

  return (
    <div>
      <h1>Servidores</h1>

      {guilds.map(g => (
        <div key={g.id}>
          <p>{g.name}</p>
          <button onClick={() => navigate(`/guild/${g.id}`)}>
            Configurar
          </button>
        </div>
      ))}
    </div>
  );
}

export default Home;