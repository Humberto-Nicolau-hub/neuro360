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
  const [score, setScore] = useState(0);
  const [plano, setPlano] = useState("free");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email 📩");
  };

  const falarComIA = async () => {
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

      calcularScore();

    } catch (err) {
      alert("Erro ao conectar com IA");
    }

    setLoading(false);
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

  const calcularScore = async () => {
    const { data } = await supabase
      .from("registros")
      .select("emocao")
      .eq("user_id", session?.user?.id);

    let total = 0;

    data?.forEach(e => {
      if (e.emocao === "Feliz") total += 2;
      if (e.emocao === "Triste") total -= 1;
      if (e.emocao === "Ansioso") total -= 2;
    });

    setScore(total);
  };

  // LOGIN
  if (!session) {
    return (
      <div style={styles.container}>
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

  // APP
  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1>NeuroMapa360</h1>
        <p>{session.user.email}</p>

        <div style={styles.badges}>
          <span>Plano: {plano}</span>
          <span>Score: {score}</span>
        </div>

        {/* BOTÃO PREMIUM */}
        {plano !== "premium" && (
          <button style={styles.premium}>
            ⭐ Upgrade para Premium
          </button>
        )}
      </div>

      {/* INPUT */}
      <div style={styles.box}>
        <h3>Como você está se sentindo?</h3>

        <select
          value={emocao}
          onChange={(e) => setEmocao(e.target.value)}
          style={styles.input}
        >
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Feliz</option>
        </select>

        <input
          placeholder="Descreva..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={styles.input}
        />

        <button onClick={falarComIA} style={styles.button}>
          {loading ? "Processando..." : "Falar com IA"}
        </button>
      </div>

      {/* RESPOSTA */}
      {resposta && (
        <div style={styles.box}>
          <h3>Resposta da IA</h3>
          <p>{resposta}</p>
        </div>
      )}

      {/* RELATÓRIO */}
      <div style={styles.box}>
        <button onClick={gerarRelatorio} style={styles.button}>
          Gerar Relatório 🧠
        </button>

        {relatorio && (
          <>
            <h3>Relatório Emocional</h3>
            <p>{relatorio}</p>
          </>
        )}
      </div>

    </div>
  );
}

// 🎨 ESTILO PROFISSIONAL
const styles = {
  container: {
    maxWidth: 600,
    margin: "auto",
    padding: 20,
    fontFamily: "Arial",
  },
  header: {
    marginBottom: 30,
  },
  badges: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },
  box: {
    background: "#f5f5f5",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
  },
  button: {
    marginTop: 15,
    padding: 10,
    width: "100%",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 5,
  },
  premium: {
    marginTop: 15,
    padding: 10,
    background: "gold",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
};
