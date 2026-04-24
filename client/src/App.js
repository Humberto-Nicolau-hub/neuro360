import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

const EMOCOES = ["Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido"];

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [grafico, setGrafico] = useState([]);
  const [plano, setPlano] = useState("free");
  const [loading, setLoading] = useState(false);

  // 🔥 SCROLL
  useEffect(() => {
    if (resposta) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [resposta]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ✅ LOGIN CORRIGIDO
  const login = async () => {
    if (!email) return alert("Digite seu email");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      alert("Erro ao enviar email: " + error.message);
    } else {
      alert("Confira seu email para acessar 🚀");
    }
  };

  const falarComIA = async () => {
    if (!texto) return alert("Descreva algo");

    setLoading(true);

    try {
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

    } catch {
      alert("Erro IA");
    }

    setLoading(false);
  };

  const falarComIALimitado = () => {
    if (plano === "free" && resposta) {
      return alert("Upgrade para PREMIUM para continuar 🚀");
    }
    falarComIA();
  };

  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1>NeuroMapa360</h1>

          <input
            style={styles.input}
            placeholder="Seu email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <button style={styles.button} onClick={login}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      
      <div style={styles.sidebar}>
        <h2>Neuro360</h2>

        <button style={styles.menuItem}>Dashboard</button>
        <button style={styles.menuItem}>Relatórios</button>

        <button
          style={{...styles.menuItem, color:"#22c55e"}}
          onClick={()=>alert("Stripe entra no próximo passo")}
        >
          Upgrade Premium
        </button>

        <button
          style={styles.logout}
          onClick={() => supabase.auth.signOut()}
        >
          Sair
        </button>
      </div>

      <div style={styles.main}>
        
        <h1>Dashboard Emocional</h1>

        <div style={styles.card}>
          <select
            style={styles.input}
            value={emocao}
            onChange={(e)=>setEmocao(e.target.value)}
          >
            {EMOCOES.map(e => <option key={e}>{e}</option>)}
          </select>

          <input
            style={styles.input}
            placeholder="Como você está?"
            value={texto}
            onChange={(e)=>setTexto(e.target.value)}
          />

          <button style={styles.button} onClick={falarComIALimitado}>
            {loading ? "Pensando..." : "Falar com IA"}
          </button>
        </div>

        {resposta && (
          <div style={styles.card}>
            <h3>Insight da IA</h3>
            <p>{resposta}</p>
          </div>
        )}

        {grafico.length > 0 && (
          <div style={styles.card}>
            <EvolucaoChart data={grafico} />
          </div>
        )}

      </div>
    </div>
  );
}

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
    flexDirection: "column",
    gap: 10
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
    marginBottom: 20
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
    color: "#fff"
  },
  menuItem: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    textAlign: "left",
    padding: 8
  },
  logout: {
    marginTop: "auto",
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
