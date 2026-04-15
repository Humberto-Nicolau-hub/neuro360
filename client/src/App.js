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
  const [plano, setPlano] = useState("free");
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [relatorio, setRelatorio] = useState("");

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

    carregarGrafico();
  };

  const carregarGrafico = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/grafico", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: session?.user?.id,
      }),
    });

    const data = await res.json();
    setDadosGrafico(data.data);
  };

  // 🔥 RELATÓRIO FUNCIONANDO
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

    if (data.relatorio) {
      setRelatorio(data.relatorio);
    }
  };

  const irParaPagamento = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST",
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // 🔐 LOGIN
  if (!session) {
    return (
      <div style={styles.container}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Seu email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={login}>Entrar</button>
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
          <p style={{ color: "#00ffcc" }}>
            ✨ IA Avançada ativada
          </p>
        )}

        {plano !== "premium" && (
          <button onClick={irParaPagamento} style={styles.premium}>
            ⭐ Upgrade para Premium
          </button>
        )}
      </div>

      {/* INPUT */}
      <div style={styles.box}>
        <h3>Como você está se sentindo?</h3>

        <select
          style={styles.input}
          onChange={(e) => setEmocao(e.target.value)}
        >
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Feliz</option>
          <option>Cansado</option>
        </select>

        <input
          style={styles.input}
          placeholder="Digite como você está se sentindo..."
          onChange={(e) => setTexto(e.target.value)}
        />

        <button style={styles.botaoIA} onClick={falarComIA}>
          Falar com IA
        </button>

        <button style={styles.botaoRelatorio} onClick={gerarRelatorio}>
          📊 Gerar Relatório
        </button>

        {plano === "free" && (
          <p style={{ color: "red", marginTop: 10 }}>
            🔒 Relatório completo disponível no Premium
          </p>
        )}
      </div>

      {/* RESPOSTA */}
      {resposta && (
        <div style={styles.box}>
          <h3>Resposta da IA:</h3>
          <p>{resposta}</p>
        </div>
      )}

      {/* RELATÓRIO */}
      {relatorio && (
        <div style={styles.relatorioBox}>
          <h3>📊 Relatório Emocional</h3>
          <p>{relatorio}</p>
        </div>
      )}

      {/* DASHBOARD */}
      <div style={styles.box}>
        <h3>📈 Evolução emocional</h3>

        {dadosGrafico.map((d, i) => (
          <div key={i}>
            {d.emocao} - {new Date(d.created_at).toLocaleDateString()}
          </div>
        ))}
      </div>

    </div>
  );
}

// 🎨 ESTILO MELHORADO
const styles = {
  container: {
    maxWidth: 700,
    margin: "auto",
    padding: 20,
    fontFamily: "Arial",
  },
  hero: {
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    color: "#fff",
    padding: 30,
    borderRadius: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  premium: {
    marginTop: 15,
    background: "gold",
    padding: 12,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
  },
  box: {
    background: "#f1f5f9",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
  },
  botaoIA: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    background: "#38bdf8",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  botaoRelatorio: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    background: "#8b5cf6",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  relatorioBox: {
    background: "#eef2ff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
};
