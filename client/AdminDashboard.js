import React, {
  useEffect,
  useState,
} from "react";

const API_URL =
  "https://backend-neuro360.onrender.com";

export default function AdminDashboard({
  voltar,
}) {
  const [dados, setDados] =
    useState(null);

  async function carregar() {
    try {
      const response = await fetch(
        `${API_URL}/admin/dashboard`
      );

      const data =
        await response.json();

      setDados(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    carregar();

    const interval =
      setInterval(carregar, 5000);

    return () =>
      clearInterval(interval);
  }, []);

  if (!dados) {
    return (
      <div
        style={{
          background: "#020617",
          color: "#fff",
          height: "100vh",
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        style={styles.back}
        onClick={voltar}
      >
        ← Voltar
      </button>

      <h1>
        📊 Dashboard Inteligente
      </h1>

      <div style={styles.grid}>
        <Card
          titulo="Usuários"
          valor={dados.totalUsuarios}
        />

        <Card
          titulo="Registros"
          valor={dados.totalRegistros}
        />

        <Card
          titulo="Memórias"
          valor={dados.totalMemorias}
        />

        <Card
          titulo="Emoção Dominante"
          valor={
            dados.emocaoDominante
          }
        />

        <Card
          titulo="Hawkins Médio"
          valor={`${dados.hawkinsMedio} Hz`}
        />

        <Card
          titulo="IA Terapêutica"
          valor="ONLINE"
        />
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
}) {
  return (
    <div style={styles.card}>
      <h2>{titulo}</h2>

      <p style={styles.valor}>
        {valor}
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    padding: 40,
    fontFamily: "Arial",
  },

  back: {
    marginBottom: 30,
    padding: 12,
    border: "none",
    borderRadius: 10,
    background: "#334155",
    color: "#fff",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
  },

  card: {
    background: "#0f172a",
    padding: 30,
    borderRadius: 20,
  },

  valor: {
    fontSize: 34,
    color: "#4ade80",
    marginTop: 20,
    fontWeight: "bold",
  },
};
