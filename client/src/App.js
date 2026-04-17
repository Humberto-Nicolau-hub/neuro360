import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qdodzxgabaudsnplccl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState("free");

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

  // LOGIN
  const login = async () => {
    if (!email) return alert("Digite um email");

    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email");
  };

  // IA
  const falarComIA = async () => {
    if (!texto) return alert("Descreva o que está sentindo");

    setLoading(true);

    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: session?.user?.id
        })
      });

      const data = await res.json();

      setResposta(data.resposta);
      setPlano(data.plano);

    } catch (err) {
      alert("Erro na IA");
    }

    setLoading(false);
  };

  // PAGAMENTO
  const upgrade = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST"
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // LOGIN SCREEN
  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          
          <img
            src="https://images.unsplash.com/photo-1581090700227-1e8e2b3f6c8c"
            alt="Cérebro IA"
            style={styles.image}
          />

          <h1 style={styles.title}>NeuroMapa360</h1>
          <p style={styles.subtitle}>Sua mente com Inteligência Artificial</p>

          <input
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <button onClick={login} style={styles.button}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1>NeuroMapa360</h1>
        <p>Sua mente com IA</p>

        <h3>Plano: {plano.toUpperCase()}</h3>

        {plano === "free" && (
          <button onClick={upgrade} style={styles.upgrade}>
            Upgrade Premium
          </button>
        )}

        <select
          value={emocao}
          onChange={(e) => setEmocao(e.target.value)}
          style={styles.input}
        >
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Motivado</option>
          <option>Confuso</option>
        </select>

        <textarea
          placeholder="Descreva como você está..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={styles.textarea}
        />

        <button onClick={falarComIA} style={styles.iaButton}>
          {loading ? "Pensando..." : "Falar com IA"}
        </button>

        <button style={styles.reportButton}>
          Gerar Relatório
        </button>

        {resposta && (
          <div style={styles.response}>
            <h3>Resposta da IA</h3>
            <p>{resposta}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 ESTILO PROFISSIONAL
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  loginContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #020617, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  loginCard: {
    background: "#0f172a",
    padding: 30,
    borderRadius: 20,
    width: 350,
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.5)"
  },
  image: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 20
  },
  title: {
    color: "#fff"
  },
  subtitle: {
    color: "#94a3b8"
  },
  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 20,
    width: 400
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    border: "1px solid #ccc"
  },
  textarea: {
    width: "100%",
    height: 100,
    marginTop: 10,
    padding: 10
  },
  button: {
    width: "100%",
    marginTop: 15,
    padding: 10,
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  iaButton: {
    width: "100%",
    marginTop: 15,
    padding: 12,
    background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  reportButton: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  upgrade: {
    marginTop: 10,
    padding: 10,
    background: "#f59e0b",
    border: "none",
    borderRadius: 8
  },
  response: {
    marginTop: 20,
    padding: 15,
    background: "#f1f5f9",
    borderRadius: 10
  }
};
