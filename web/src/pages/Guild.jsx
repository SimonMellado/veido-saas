import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API;

function Guild() {
  const { id } = useParams();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch(`${API}/guild/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, [id]);

  if (!config) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{config.name}</h1>

      <p>ID: {config.guildId}</p>

      <p>Levels: {config.modules?.levels ? "ON" : "OFF"}</p>
      <p>Welcome: {config.modules?.welcome ? "ON" : "OFF"}</p>
    </div>
  );
}

export default Guild;