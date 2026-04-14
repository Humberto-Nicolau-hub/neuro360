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

  // 🔥 CORREÇÃO DO LOGIN TROCANDO USUÁRIO
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔥 LIMPA CACHE (resolve bug de email trocado)
  const limparSessao = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  // LOGIN COM MAGIC LINK
  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email 📩");
  };

  // CHAMADA PARA IA
  const falarComIA = async () => {
    const res = await fetch("https://SEU-BACKEND.onrender.com/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texto, emocao }),
    });

    const data = await res.json();
    setResposta(data.resposta);
  };

  // TELA LOGIN
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <button onClick={login}>Entrar / Cadastrar</button>
      </div>
    );
  }

  // TELA PRINCIPAL
  return (
    <div style={{ padding: 40 }}>
      <h1>NeuroMapa360</h1>

      <p><strong>{session.user.email}</strong></p>

      <button onClick={limparSessao}>Trocar usuário</button>

      <h3>Como você está se sentindo?</h3>

      <select value={emocao} onChange={(e) => setEmocao(e.target.value)}>
        <option>Ansioso</option>
        <option>Triste</option>
        <option>Feliz</option>
        <option>Cansado</option>
      </select>

      <br /><br />

      <input
        placeholder="Descreva como você está"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      <br /><br />

      <button onClick={falarComIA}>Falar com IA</button>

      <h3>Resposta:</h3>
      <p>{resposta}</p>
    </div>
  );
}
