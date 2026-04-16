```javascript
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

  // 🔐 Sessão
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

      const result = await res.json();

      setResposta(result.resposta);
      setPlano(result.plano);

      if (result.bloqueado) {
        setBloqueado(true);
      } else {
        await carregarDashboard();
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

      const result = await res.json();
      setDados(result.dados || []);

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

    } catch {
      alert("Erro no pagamento");
    }
  };

  // 🚀 LOGIN SCREEN
  if (!session) {
    return (
      <div style={styles.login}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Seu email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  // 🚀 APP
  return (
    <div style={styles.container}>

      <div style={styles.hero}>
        <h2>NeuroMapa360</h2>
        <p>Plano: {plano.toUpperCase()}</p>

        {plano !== "premium" && (
          <button onClick={irParaPagamento} style={styles.premium}>
            ⭐ Upgrade Premium
          </button>
        )}
      </div>

      {bloqueado && (
        <p style={{ color: "red" }}>
          🔒 Limite FREE atingido. Faça upgrade.
        </p>
      )}

      <div style={styles.box}>
        <select onChange={(e) => setEmocao(e.target.value)}>
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Feliz</option>
          <option>Cansado</option>
        </select>

        <input
          placeholder="Descreva como você está..."
          onChange={(e) => setTexto(e.target.value)}
        />

        <button onClick={falarComIA} disabled={loading || bloqueado}>
          {loading ? "Processando..." : "Falar com IA"}
        </button>
      </div>

      {resposta && <p>{resposta}</p>}

      {dados.length > 0 && (
        <>
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
        </>
      )}
    </div>
  );
}

// 🎨 ESTILO
const styles = {
  container: {
    maxWidth: 500,
    margin: "auto",
    padding: 20,
  },
  login: {
    textAlign: "center",
    marginTop: 100,
  },
  hero: {
    textAlign: "center",
    marginBottom: 20,
  },
  premium: {
    background: "gold",
    padding: 10,
    border: "none",
    marginTop: 10,
  },
  box: {
    background: "#f1f5f9",
    padding: 20,
    borderRadius: 10,
  },
};
```
