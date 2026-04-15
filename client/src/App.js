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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email para login");
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

      carregarGrafico();
    } catch (err) {
      console.error(err);
      setResposta("Erro ao conectar com IA.");
    }

    setLoading(false);
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
    setDadosGrafico(data.data || []);
  };

  const irParaPagamento = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST",
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  const gerarRelatorio = async () => {
    alert("Relatório emocional gerado com sucesso 🚀");
  };

  // LOGIN
  if (!session) {
    return (
      <div style={styles.login}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Digite seu email"
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

      {/* HERO COM VISUAL FORTE */}
      <div style={styles.hero}>
        <h1>NeuroMapa360</h1>
        <p>Sua mente com IA</p>

        {plano !== "premium" && (
          <button onClick={irParaPagamento} style={styles.premium}>
            ⭐ Upgrade para Premium
          </button>
        )}
      </div>

      {/* CARD PRINCIPAL */}
      <div style={styles.card}>

        <h3>Como você está se sentindo?</h3>

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
          placeholder="Descreva seu sentimento..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={styles.input}
        />

        <button onClick={falarComIA} style={styles.primary}>
          {loading ? "Pensando..." : "Falar com IA"}
        </button>

        {/* BOTÃO RELATÓRIO */}
        <button onClick={gerarRelatorio} style={styles.relatorio}>
          📊 Gerar Relatório
        </button>

        {/* RESPOSTA */}
        {resposta && (
          <div style={styles.resposta}>
            <h4>Resposta da IA:</h4>
            <p>{resposta}</p>
          </div>
        )}
      </div>

      {/* DASHBOARD */}
      <div style={styles.card}>
        <h3>📈 Evolução emocional</h3>

        {dadosGrafico.length === 0 && <p>Sem dados ainda</p>}

        {dadosGrafico.map((d, i) => (
          <div key={i}>
            {d.emocao} - {new Date(d.created_at).toLocaleDateString()}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#f4f6f9",
    minHeight: "100vh",
    paddingBottom: 40,
  },

  login: {
    maxWidth: 400,
    margin: "100px auto",
    textAlign: "center",
  },

  hero: {
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    color: "#fff",
    padding: 40,
    textAlign: "center",
    borderRadius: "0 0 20px 20px",
  },

  premium: {
    marginTop: 15,
    background: "#f1c40f",
    padding: 12,
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  },

  card: {
    maxWidth: 600,
    margin: "20px auto",
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
  },

  primary: {
    width: "100%",
    padding: 12,
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },

  relatorio: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    background: "#8e44ad",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },

  button: {
    padding: 10,
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: 5,
  },

  resposta: {
    marginTop: 20,
    background: "#ecf0f1",
    padding: 15,
    borderRadius: 10,
  },
};
