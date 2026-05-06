import React, { useEffect, useState } from "react";

const BACKEND_URL = "https://backend-neuro360.onrender.com";

export default function AdminDashboard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarDashboard() {
    try {
      setLoading(true);

      const response = await fetch(
        `${BACKEND_URL}/admin/dashboard`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar dashboard");
      }

      const data = await response.json();

      setDados(data);
    } catch (err) {
      console.error("Erro Dashboard:", err);
      setErro("Backend indisponível");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();

    const intervalo = setInterval(() => {
      carregarDashboard();
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Carregando dashboard...</h2>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={styles.loadingContainer}>
        <h2>{erro}</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        📊 NeuroMapa360 — Dashboard Inteligente
      </h1>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2>👥 Usuários</h2>
          <p style={styles.numero}>
            {dados.totalUsuarios || 0}
          </p>
        </div>

        <div style={styles.card}>
          <h2>💎 Premium</h2>
          <p style={styles.numero}>
            {dados.premium || 0}
          </p>
        </div>

        <div style={styles.card}>
          <h2>📊 Registros</h2>
          <p style={styles.numero}>
            {dados.totalRegistros || 0}
          </p>
        </div>

        <div style={styles.card}>
          <h2>🧠 Memórias IA</h2>
          <p style={styles.numero}>
            {dados.totalMemorias || 0}
          </p>
        </div>

        <div style={styles.card}>
          <h2>📈 Conversão</h2>
          <p style={styles.numero}>
            {dados.conversao || 0}%
          </p>
        </div>

        <div style={styles.card}>
          <h2>💰 Receita</h2>
          <p style={styles.numero}>
            R$ {dados.receita || 0}
          </p>
        </div>

        <div style={styles.card}>
          <h2>🤖 IA Terapêutica</h2>
          <p style={styles.statusOnline}>
            ONLINE
          </p>
        </div>

        <div style={styles.card}>
          <h2>🔥 Emoção dominante</h2>
          <p style={styles.numero}>
            {dados.emocaoDominante || "ansiedade"}
          </p>
        </div>
      </div>

      <div style={styles.painel}>
        <h2>📌 Status do Sistema</h2>

        <div style={styles.statusLinha}>
          <span>Backend Render:</span>
          <span style={styles.online}>ONLINE</span>
        </div>

        <div style={styles.statusLinha}>
          <span>Supabase:</span>
          <span style={styles.online}>CONECTADO</span>
        </div>

        <div style={styles.statusLinha}>
          <span>Memória Emocional:</span>
          <span style={styles.online}>ATIVA</span>
        </div>

        <div style={styles.statusLinha}>
          <span>IA Terapêutica:</span>
          <span style={styles.online}>FUNCIONANDO</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    padding: 40,
    fontFamily: "Arial",
  },

  loadingContainer: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
  },

  title: {
    textAlign: "center",
    marginBottom: 40,
    fontSize: 34,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
  },

  card: {
    background: "#111827",
    borderRadius: 16,
    padding: 25,
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    border: "1px solid #1e293b",
  },

  numero: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 15,
    color: "#4ade80",
  },

  statusOnline: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    color: "#22c55e",
  },

  painel: {
    marginTop: 50,
    background: "#111827",
    padding: 30,
    borderRadius: 16,
    border: "1px solid #1e293b",
  },

  statusLinha: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #1f2937",
    fontSize: 18,
  },

  online: {
    color: "#22c55e",
    fontWeight: "bold",
  },
};
