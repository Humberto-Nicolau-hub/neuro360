import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart.js";

// 🔐 SUPABASE
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

const EMOCOES = [
  "Ansioso","Triste","Feliz","Estressado","Desmotivado",
  "Deprimido","Desorientado","Confuso","Procrastinador"
];

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [relatorio, setRelatorio] = useState("");
  const [plano, setPlano] = useState("free");
  const [grafico, setGrafico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limiteAtingido, setLimiteAtingido] = useState(false);

  // 🚀 SCROLL AUTOMÁTICO PROFISSIONAL
  useEffect(() => {
    if (resposta || relatorio) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }, 100);
    }
  }, [resposta, relatorio]);

  const verificarLimiteLocal = () => {
    if (plano === "premium") return true;

    const hoje = new Date().toISOString().slice(0, 10);
    const key = `uso_${session?.user?.id}_${hoje}`;
    const uso = parseInt(localStorage.getItem(key) || "0");

    if (uso >= 3) {
      setLimiteAtingido(true);
      return false;
    }

    localStorage.setItem(key, uso + 1);
    return true;
  };

  const buscarPlano = async (user_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/plano/${user_id}`);
      const data = await res.json();
      return data?.plano || "free";
    } catch {
      return "free";
    }
  };

  const carregarGrafico = async (user_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/evolucao/${user_id}`);
      const data = await res.json();
      setGrafico(Array.isArray(data) ? data : []);
    } catch {
      setGrafico([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionData = data.session;

      setSession(sessionData);

      if (sessionData?.user) {
        const user_id = sessionData.user.id;
        setPlano(await buscarPlano(user_id));
        await carregarGrafico(user_id);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);

        if (session?.user) {
          const user_id = session.user.id;
          setPlano(await buscarPlano(user_id));
          await carregarGrafico(user_id);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const login = async () => {
    if (!email) return alert("Digite um email");

    const password = "123456";

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session) return;

    await supabase.auth.signUp({ email, password });

    alert("Conta criada ou logada!");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.reload();
  };

  const falarComIA = async () => {
    if (!texto) return alert("Descreva o que está sentindo");
    if (!verificarLimiteLocal()) return alert("Limite FREE atingido");

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: session?.user?.id,
          plano
        }),
      });

      const data = await res.json();

      setResposta(data?.resposta || "");
      if (data?.plano) setPlano(data.plano);

      await carregarGrafico(session.user.id);

    } catch {
      alert("Erro IA");
    }

    setLoading(false);
  };

  const gerarRelatorio = async () => {
    if (plano !== "premium") return alert("Premium apenas");

    try {
      const res = await fetch(`${BACKEND_URL}/relatorio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session?.user?.id,
        }),
      });

      const data = await res.json();
      setRelatorio(data?.relatorio || "");
    } catch {
      alert("Erro relatório");
    }
  };

  // 🔐 LOGIN UI
  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>NeuroMapa360</h1>
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

  // 🔥 APP UI
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>NeuroMapa360</h1>
        <p><strong>Plano:</strong> {plano.toUpperCase()}</p>

        <button style={styles.logout} onClick={logout}>Sair</button>

        <select
          style={styles.input}
          value={emocao}
          onChange={(e) => setEmocao(e.target.value)}
        >
          {EMOCOES.map((e) => (
            <option key={e}>{e}</option>
          ))}
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

        <button style={styles.buttonSecondary} onClick={gerarRelatorio}>
          Gerar Relatório
        </button>

        {resposta && <p>{resposta}</p>}
        {relatorio && <p>{relatorio}</p>}

        {grafico.length > 0 && (
          <>
            <h3>Evolução Emocional</h3>
            <EvolucaoChart data={grafico} />
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    width: 350,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  input: {
    width: "100%",
    padding: 10,
    margin: "10px 0",
    borderRadius: 6,
    border: "1px solid #ccc"
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    marginTop: 10
  },
  buttonSecondary: {
    width: "100%",
    padding: 12,
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    marginTop: 10
  },
  logout: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    marginBottom: 10
  }
};
