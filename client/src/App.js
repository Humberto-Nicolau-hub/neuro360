import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [relatorio, setRelatorio] = useState("");
  const [plano, setPlano] = useState("free");
  const [loading, setLoading] = useState(false);

  const topRef = useRef(null);

  const scrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔥 BUSCAR PLANO PELO BACKEND (CORRETO)
  const buscarPlano = async (user_id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/plano/${user_id}`);
      const data = await res.json();
      return data.plano || "free";
    } catch {
      return "free";
    }
  };

  // 🔥 INIT
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);

      if (data.session?.user) {
        localStorage.setItem("user_id", data.session.user.id);

        const planoAtual = await buscarPlano(data.session.user.id);
        setPlano(planoAtual);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);

        if (session?.user) {
          localStorage.setItem("user_id", session.user.id);

          const planoAtual = await buscarPlano(session.user.id);
          setPlano(planoAtual);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔐 LOGIN
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

  // 🚪 LOGOUT REAL (AGORA PERFEITO)
  const logout = async () => {
    await supabase.auth.signOut();

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/";
  };

  // 🤖 IA
  const falarComIA = async () => {
    if (!texto) return alert("Descreva o que está sentindo");

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/ia`, {
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

      if (data.plano) setPlano(data.plano);

      scrollTop();
    } catch {
      alert("Erro IA");
    }

    setLoading(false);
  };

  // 📊 RELATÓRIO
  const gerarRelatorio = async () => {
    if (plano !== "premium") {
      return alert("🔒 Premium apenas");
    }

    const res = await fetch(`${BACKEND_URL}/relatorio`, {
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

    scrollTop();
  };

  // 💳 CHECKOUT
  const irParaPagamento = async () => {
    const res = await fetch(`${BACKEND_URL}/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: session.user.id,
      }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // 🔐 LOGIN UI
  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>NeuroMapa360</h1>

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
    <div style={{ height: "100vh", overflowY: "auto" }}>
      <div ref={topRef}></div>

      <div style={styles.container}>
        <div style={styles.appBox}>
          <h1>NeuroMapa360</h1>

          <p><strong>Plano:</strong> {plano.toUpperCase()}</p>

          <button style={styles.logout} onClick={logout}>
            Sair
          </button>

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
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    paddingTop: 40,
  },
  card: {
    background: "#0f172a",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
    color: "white",
  },
  title: { fontSize: 28 },
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
  logout: {
    background: "red",
    padding: 8,
    marginBottom: 10,
    border: "none",
    borderRadius: 6,
    color: "white",
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
