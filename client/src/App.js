import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

// 🔐 SUPABASE
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
  const [dados, setDados] = useState([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  // 🔐 LOGIN
  const login = async () => {
    if (!email) return alert("Digite um email válido");
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email 📩");
  };

  // 🤖 IA
  const falarComIA = async () => {
    if (!texto) return alert("Descreva como você está");

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

      if (data.bloqueado) {
        setBloqueado(true);
      } else {
        carregarDashboard();
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com IA");
    }

    setLoading(false);
  };

  // 📊 DASHBOARD
  const carregarDashboard = async () => {
    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session?.user?.id,
        }),
      });

      const data = await res.json();
      setDados(data.dados || []);
    } catch (err) {
      console.error("Erro dashboard:", err);
    }
  };

  // 💳 PAGAMENTO
  const irParaPagamento = async () => {
    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
        method: "POST",
      });

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      alert("Erro ao iniciar pagamento");
    }
  };

  // 🚀 LANDING (ANTES DO LOGIN)
  if (!session) {
    return (
      <div style={styles.landing}>
        <div style={styles.card}>
          <h1>NeuroMapa360</h1>
          <p>Sua mente com IA</p>

          <input
            placeholder="Seu email"
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <button onClick={login} style={styles.primary}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // 🚀 APP
  return (
    <div style={styles.container}>

      {/* HERO */}
      <div style={styles.hero}>
        <h2>NeuroMapa360</h2>
        <p>Plano: {plano.toUpperCase()}</p>

        {plano !== "premium" && (
          <button onClick={irParaPagamento} style={styles.premium}>
            ⭐ Upgrade Premium
          </button>
        )}
      </div>

      {/* BLOQUEIO */}
      {bloqueado && (
        <p style={styles.bloqueio}>
          🔒 Limite FREE atingido. Faça upgrade para continuar.
        </p>
      )}

      {/* FORM */}
      <div style={styles.box}>
        <select
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
          onChange={(e) => setTexto(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={falarComIA}
          style={styles.primary}
          disabled={loading || bloqueado}
        >
          {loading ? "Processando..." : "Falar com IA"}
        </button>

        <button style={styles.secondary}>
          📊 Gerar Relatório (Premium)
        </button>
      </div>

      {/* RESPOSTA */}
      {resposta && (
        <div style={styles.resposta}>
          <h4>Resposta da IA</h4>
          <p>{resposta}</p>
        </div>
      )}

      {/* DASHBOARD */}
      {dados.length > 0 && (
        <div style={styles.dashboard}>
          <h3>📊 Evolução emocional</h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// 🎨 ESTILO PROFISSIONAL
const styles = {
  landing: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
  },
  card: {
    background: "#111827",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
    color: "#fff",
    width: 320,
  },
  container: {
    maxWidth: 500,
    margin: "auto",
    padding: 20,
  },
  hero: {
    textAlign: "center",
    marginBottom: 20,
  },
  box: {
    background: "#f1f5f9",
    padding: 20,
    borderRadius: 10,
  },
  resposta: {
    marginTop: 20,
    background: "#e2e8f0",
    padding: 15,
    borderRadius: 10,
  },
  dashboard: {
    marginTop: 20,
    background: "#f8fafc",
    padding: 15,
    borderRadius: 10,
  },
  bloqueio: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  primary: {
    width: "100%",
    padding: 10,
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    marginBottom: 10,
  },
  secondary: {
    width: "100%",
    padding: 10,
    background: "#8b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  },
  premium: {
    marginTop: 10,
    background: "gold",
    padding: 8,
    border: "none",
    borderRadius: 6,
  },
};
