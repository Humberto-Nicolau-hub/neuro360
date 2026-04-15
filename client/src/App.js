import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email");
  };

  const falarComIA = async () => {
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
  };

  const gerarRelatorio = async () => {
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

  const irParaPagamento = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST",
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  if (!session) {
    return (
      <div style={styles.login}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Seu email"
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <button onClick={login} style={styles.button}>
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* HERO */}
      <div style={styles.hero}>
        <h1>NeuroMapa360</h1>
        <p>Sua mente com IA</p>

        <p>
          Plano: <b>{plano.toUpperCase()}</b>
        </p>

        {plano === "premium" && (
          <p style={{ color: "#00ffcc" }}>✨ IA Avançada ativa</p>
        )}

        {plano !== "premium" && (
          <button onClick={irParaPagamento} style={styles.premium}>
            ⭐ Upgrade Premium
          </button>
        )}
      </div>

      {/* INPUT */}
      <div style={styles.box}>
        <select
          value={emocao}
          onChange={(e) => setEmocao(e.target.value)}
          style={styles.input}
        >
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Feliz</option>
          <option>Cansado</option>
        </select>

        <input
          placeholder="Descreva como você está..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={styles.input}
        />

        <button onClick={falarComIA} style={styles.botaoIA}>
          Falar com IA
        </button>

        <button onClick={gerarRelatorio} style={styles.botaoRelatorio}>
          📊 Gerar Relatório
        </button>

        {plano === "free" && (
          <p style={{ color: "red" }}>
            🔒 Relatório completo disponível no Premium
          </p>
        )}
      </div>

      {/* RESPOSTA */}
      {resposta && (
        <div style={styles.box}>
          <h3>Resposta da IA</h3>
          <p>{resposta}</p>
        </div>
      )}

      {/* RELATÓRIO */}
      {relatorio && (
        <div style={styles.relatorio}>
          <h3>📊 Relatório Emocional</h3>
          <p>{relatorio}</p>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: "auto", padding: 20 },
  login: { textAlign: "center", marginTop: 100 },
  hero: {
    background: "#0f172a",
    color: "#fff",
    padding: 30,
    borderRadius: 10,
    textAlign: "center",
    marginBottom: 20,
  },
  premium: {
    background: "gold",
    padding: 10,
    border: "none",
    borderRadius: 5,
    marginTop: 10,
  },
  box: {
    background: "#f1f5f9",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: { width: "100%", padding: 10, marginBottom: 10 },
  botaoIA: {
    width: "100%",
    padding: 12,
    background: "#38bdf8",
    border: "none",
    color: "#fff",
    marginTop: 10,
  },
  botaoRelatorio: {
    width: "100%",
    padding: 12,
    background: "#8b5cf6",
    border: "none",
    color: "#fff",
    marginTop: 10,
  },
  relatorio: {
    background: "#eef2ff",
    padding: 20,
    borderRadius: 10,
  },
};
