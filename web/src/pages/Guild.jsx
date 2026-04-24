import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function Guild() {
  const { id } = useParams();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3001/guild/${id}`)
      .then(res => res.json())
      .then(setConfig);
  }, [id]);

  const toggleLevels = async () => {
    const res = await fetch(
      `http://localhost:3001/guild/${id}/levels`,
      { method: "POST" }
    );

    const data = await res.json();
    setConfig(data);
  };

  const toggleWelcome = async () => {
    const res = await fetch(
      `http://localhost:3001/guild/${id}/welcome`,
      { method: "POST" }
    );

    const data = await res.json();
    setConfig(data);
  };

  if (!config) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Servidor: {config.name}</h1>

      <p>Levels: {config.modules.levels ? "ON" : "OFF"}</p>
      <button onClick={toggleLevels}>Toggle Levels</button>

      <p>Welcome: {config.modules.welcome ? "ON" : "OFF"}</p>
      <button onClick={toggleWelcome}>Toggle Welcome</button>
    </div>
  );
}

export default Guild;