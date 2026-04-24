import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

const EMOCOES = ["Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido"];

export default function App() {
  const [session, setSession] = useState(null);
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [grafico, setGrafico] = useState([]);
  const [plano, setPlano] = useState("free");

  // 🔥 SCROLL AUTOMÁTICO
  useEffect(() => {
    if (resposta) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [resposta]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const falarComIA = async () => {
    const res = await fetch(`${BACKEND_URL}/ia`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session?.user?.id
      })
    });

    const data = await res.json();
    setResposta(data.resposta);
  };

  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1>NeuroMapa360</h1>
          <button
            style={styles.button}
            onClick={() =>
              supabase.auth.signInWithOtp({ email: "teste@email.com" })
            }
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2 style={{marginBottom:20}}>Neuro360</h2>

        <button style={styles.menuItem}>Dashboard</button>
        <button style={styles.menuItem}>Relatórios</button>
        <button style={styles.menuItem}>Histórico</button>
        <button style={styles.menuItem}>Plano</button>

        <div style={{marginTop:"auto"}}>
          <button
            style={styles.logout}
            onClick={() => supabase.auth.signOut()}
          >
            Sair
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        
        <h1 style={{marginBottom:20}}>Dashboard Emocional</h1>

        {/* CARD IA */}
        <div style={styles.card}>
          <h3>Como você está hoje?</h3>

          <select
            style={styles.input}
            value={emocao}
            onChange={(e)=>setEmocao(e.target.value)}
          >
            {EMOCOES.map(e => <option key={e}>{e}</option>)}
          </select>

          <input
            style={styles.input}
            placeholder="Descreva seu estado"
            value={texto}
            onChange={(e)=>setTexto(e.target.value)}
          />

          <button style={styles.button} onClick={falarComIA}>
            Falar com IA
          </button>
        </div>

        {/* RESPOSTA */}
        {resposta && (
          <div style={styles.card}>
            <h3>Insight da IA</h3>
            <p>{resposta}</p>
          </div>
        )}

        {/* GRÁFICO */}
        {grafico.length > 0 && (
          <div style={styles.card}>
            <h3>Evolução</h3>
            <EvolucaoChart data={grafico} />
          </div>
        )}

      </div>
    </div>
  );
}

// 🎨 DESIGN PREMIUM
const styles = {
  app: {
    display: "flex",
    height: "100vh",
    background: "#0f172a",
    color: "#fff"
  },

  sidebar: {
    width: 220,
    background: "#020617",
    padding: 20,
    display: "flex",
    flexDirection: "column"
  },

  main: {
    flex: 1,
    padding: 30,
    overflowY: "auto"
  },

  card: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
  },

  input: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    border: "none",
    background: "#334155",
    color: "#fff"
  },

  button: {
    marginTop: 15,
    padding: 12,
    width: "100%",
    borderRadius: 8,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer"
  },

  menuItem: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    padding: "10px 0",
    textAlign: "left",
    cursor: "pointer"
  },

  logout: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: 10,
    borderRadius: 6
  },

  loginContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a"
  },

  loginCard: {
    background: "#1e293b",
    padding: 40,
    borderRadius: 12
  }
};
