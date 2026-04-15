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
    calcularScore();
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

  if (!session) {
    return (
      <div>
        <input onChange={(e) => setEmail(e.target.value)} />
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>NeuroMapa360</h1>

      <p>{session.user.email}</p>
      <p>Plano: {plano}</p>
      <p>Score emocional: {score}</p>

      <button onClick={gerarRelatorio}>
        Gerar Relatório 🧠
      </button>

      {relatorio && (
        <div>
          <h3>Relatório</h3>
          <p>{relatorio}</p>
        </div>
      )}

      <br />

      <select onChange={(e) => setEmocao(e.target.value)}>
        <option>Ansioso</option>
        <option>Triste</option>
        <option>Feliz</option>
      </select>

      <input
        placeholder="Digite..."
        onChange={(e) => setTexto(e.target.value)}
      />

      <button onClick={falarComIA}>
        Enviar
      </button>

      <p>{resposta}</p>
    </div>
  );
}
