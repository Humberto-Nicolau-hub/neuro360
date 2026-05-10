import React, {
  useEffect,
  useState,
} from "react";

/* ======================================================
   API
====================================================== */

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://backend-neuro360.onrender.com";

/* ======================================================
   DASHBOARD
====================================================== */

export default function AdminDashboard({
  voltar,
}) {

  const [dados, setDados] =
    useState(null);

  const [erro, setErro] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  /* ======================================================
     CARREGAR
  ====================================================== */

  async function carregar() {

    try {

      const response =
        await fetch(
          `${API_URL}/admin/dashboard`
        );

      if (!response.ok) {
        throw new Error(
          "Erro dashboard"
        );
      }

      const data =
        await response.json();

      setDados(data);

      setErro("");

    } catch (err) {

      console.error(err);

      setErro(
        "Backend indisponível"
      );

    } finally {

      setLoading(false);
    }
  }

  /* ======================================================
     EFFECT
  ====================================================== */

  useEffect(() => {

    carregar();

    const interval =
      setInterval(
        carregar,
        10000
      );

    return () =>
      clearInterval(interval);

  }, []);

  /* ======================================================
     LOADING
  ====================================================== */

  if (loading) {

    return (
      <div style={styles.loading}>
        Carregando dashboard...
      </div>
    );
  }

  /* ======================================================
     ERRO
  ====================================================== */

  if (erro) {

    return (
      <div style={styles.loading}>
        {erro}
      </div>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <div style={styles.container}>

      <button
        style={styles.back}
        onClick={voltar}
      >
        ← Voltar
      </button>

      <h1 style={styles.title}>
        📊 Dashboard Inteligente
      </h1>

      <div style={styles.grid}>

        <Card
          titulo="Usuários"
          valor={
            dados?.totalUsuarios || 0
          }
        />

        <Card
          titulo="Premium"
          valor={
            dados?.premium || 0
          }
        />

        <Card
          titulo="Registros"
          valor={
            dados?.totalRegistros || 0
          }
        />

        <Card
          titulo="Memórias"
          valor={
            dados?.totalMemorias || 0
          }
        />

        <Card
          titulo="Score Emocional"
          valor={
            dados?.scoreEmocional || 0
          }
        />

        <Card
          titulo="Conversão"
          valor={`${dados?.conversao || 0}%`}
        />

        <Card
          titulo="Receita"
          valor={`R$ ${dados?.receita || 0}`}
        />

        <Card
          titulo="Emoção Dominante"
          valor={
            dados?.emocaoDominante ||
            "-"
          }
        />

        <Card
          titulo="Período Crítico"
          valor={
            dados?.periodoCritico ||
            "-"
          }
        />

        <Card
          titulo="IA Terapêutica"
          valor="ONLINE"
        />

      </div>

    </div>
  );
}

/* ======================================================
   CARD
====================================================== */

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

/* ======================================================
   STYLES
====================================================== */

const styles = {

  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    padding: 40,
    fontFamily: "Arial",
  },

  loading: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
    fontSize: 22,
  },

  title: {
    marginBottom: 30,
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
    border:
      "1px solid #1e293b",
  },

  valor: {
    fontSize: 34,
    color: "#4ade80",
    marginTop: 20,
    fontWeight: "bold",
  },
};
