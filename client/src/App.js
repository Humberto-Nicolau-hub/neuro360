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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique email");
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

  const irParaPagamento = async () => {
    const res = await fetch("https://neuro360-tkyx.onrender.com/create-checkout", {
      method: "POST",
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  if (!session) {
    return (
      <div style={styles.container}>
        <h1>NeuroMapa360</h1>
        <input onChange={(e) => setEmail(e.target.value)} />
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

        {plano !== "premium" && (
          <button onClick={irParaPagamento} style={styles.premium}>
            ⭐ Upgrade Premium
          </button>
        )}
      </div>

      {/* INPUT */}
      <select onChange={(e) => setEmocao(e.target.value)}>
        <option>Ansioso</option>
        <option>Triste</option>
        <option>Feliz</option>
      </select>

      <input onChange={(e) => setTexto(e.target.value)} />

      <button onClick={falarComIA}>Falar com IA</button>

      <p>{resposta}</p>

      {/* DASHBOARD */}
      <h3>📊 Evolução emocional</h3>

      {dadosGrafico.map((d, i) => (
        <div key={i}>
          {d.emocao} - {new Date(d.created_at).toLocaleDateString()}
        </div>
      ))}

    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "auto",
    padding: 20,
  },
  hero: {
    background: "#0f172a",
    color: "#fff",
    padding: 30,
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "center",
  },
  premium: {
    marginTop: 15,
    background: "gold",
    padding: 10,
    border: "none",
    borderRadius: 5,
  },
};
