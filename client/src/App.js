import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qodznxgabuaabnsplcsl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [relatorio, setRelatorio] = useState("");
  const [plano, setPlano] = useState("free");
  const [loading, setLoading] = useState(false);

  // 🔐 sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🚀 LOGIN MÁGICO
  const login = async () => {
    if (!email) return alert("Digite um email");

    await supabase.auth.signInWithOtp({ email });

    alert("📩 Verifique seu email para entrar");
  };

  // 🤖 IA
  const falarComIA = async () => {
    if (!texto) return alert("Descreva o que está sentindo");

    setLoading(true);

    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: session?.user?.id,
        }),
      });

      const data = await res.json();

      setResposta(data.resposta);
      setPlano(data.plano);
    } catch (err) {
      alert("Erro ao conectar IA");
    }

    setLoading(false);
  };

  // 📊 RELATÓRIO
  const gerarRelatorio = async () => {
    if (plano !== "premium") {
      return alert("🔒 Liberado apenas no Premium");
    }

    const res = await fetch("https://neuro360-tkyx.onrender.com/relatorio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: session?.user?.id,
      }),
    });

    const data = await res.json();
    setRelatorio(data.relatorio);
  };

  // 💳 STRIPE
  const irParaPagamento = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST",
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // 🔐 LOGIN SCREEN
  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          
          {/* 🧠 CABEÇALHO COM ÍCONE */}
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>🧠</span>
            <span style={{ marginLeft: 8, color: "#94a3b8" }}>
              Cérebro IA
            </span>
          </div>

          <h1 style={styles.title}>NeuroMapa360</h1>
          <p style={styles.subtitle}>
            Sua mente com Inteligência Artificial
          </p>

          <input
            style={styles.input}
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button style={styles.button} onClick={login}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // 🚀 APP
  return (
    <div style={styles.container}>
      <div style={styles.appBox}>
        <h1>NeuroMapa360</h1>
        <p>Plano: {plano.toUpperCase()}</p>

        {plano === "free" && (
          <button style={styles.upgrade} onClick={irParaPagamento}>
            Upgrade Premium
          </button>
        )}

        <select
          style={styles.input}
          value={emocao}
          onChange={(e) => setEmocao(e.target.value)}
        >
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Feliz</option>
          <option>Estressado</option>
        </select>

        <input
          style={styles.input}
          placeholder="Descreva como você está"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <button style={styles.button} onClick={falarComIA}>
          {loading ? "Pensando..." : "Falar com IA"}
        </button>

        <button style={styles.secondary} onClick={gerarRelatorio}>
          Gerar Relatório
        </button>

        {resposta && (
          <div style={styles.responseBox}>
            <h3>Resposta da IA</h3>
            <p>{resposta}</p>
          </div>
        )}

        {relatorio && (
          <div style={styles.responseBox}>
            <h3>Relatório</h3>
            <p>{relatorio}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 ESTILO
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
  },
  card: {
    background: "#0f172a",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 20,
  },
  input: {
    padding: 12,
    width: 250,
    marginBottom: 10,
    borderRadius: 6,
    border: "none",
  },
  button: {
    padding: 12,
    width: "100%",
    background: "#22c55e",
    border: "none",
    color: "white",
    borderRadius: 6,
    cursor: "pointer",
  },
  secondary: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#3b82f6",
    border: "none",
    color: "white",
    borderRadius: 6,
  },
  upgrade: {
    background: "gold",
    padding: 10,
    marginBottom: 10,
    border: "none",
    borderRadius: 6,
  },
  appBox: {
    background: "white",
    padding: 30,
    borderRadius: 12,
    width: 400,
  },
  responseBox: {
    marginTop: 20,
    textAlign: "left",
  },
};
