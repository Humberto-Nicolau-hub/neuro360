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
  const [loading, setLoading] = useState(false);

  // 🔐 SESSION
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔐 LOGIN
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
    } catch {
      alert("Erro ao chamar IA");
    }

    setLoading(false);
  };

  // 📊 RELATÓRIO
  const gerarRelatorio = async () => {
    setLoading(true);

    try {
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

      if (plano === "free") {
        alert("🔒 Liberado apenas no Premium");
      }

      setRelatorio(data.relatorio);
    } catch {
      alert("Erro ao gerar relatório");
    }

    setLoading(false);
  };

  // 💳 PAGAMENTO
  const irParaPagamento = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST",
    });

    const data = await res.json();

    window.location.href = data.url;
  };

  // 🔐 TELA LOGIN
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

  // 🚀 TELA PRINCIPAL
  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.hero}>
        <h1>NeuroMapa360</h1>
        <p>Sua mente com IA</p>

        <p>
          Plano: <b>{plano.toUpperCase()}</b>
        </p>

        {plano === "premium" ? (
          <p style={{ color: "#00ffcc" }}>✨ IA Avançada ativa</p>
        ) : (
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
          {loading ? "Pensando..." : "Falar com IA"}
        </button>

        <button onClick={gerarRelatorio} style={styles.botaoRelatorio}>
          📊 Gerar Relatório
        </button>

        {plano === "free" && (
          <p style={{ color: "red" }}>
            🔒 Recursos completos disponíveis no Premium
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

// 🎨 ESTILO
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
    cursor: "pointer",
  },
  box: {
    background: "#f1f5f9",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: { width: "100%", padding: 10, marginBottom: 10 },
  button: {
    width: "100%",
    padding: 12,
    background: "green",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  botaoIA: {
    width: "100%",
    padding: 12,
    background: "#38bdf8",
    border: "none",
    color: "#fff",
    marginTop: 10,
    cursor: "pointer",
  },
  botaoRelatorio: {
    width: "100%",
    padding: 12,
    background: "#8b5cf6",
    border: "none",
    color: "#fff",
    marginTop: 10,
    cursor: "pointer",
  },
  relatorio: {
    background: "#eef2ff",
    padding: 20,
    borderRadius: 10,
  },
};
