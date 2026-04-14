import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔥 CONFIGURAÇÃO CORRETA
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co", // CORRIGIDO
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZHp3eGdhYnVhZHNucGxjc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Njc4NDMsImV4cCI6MjA5MDA0Mzg0M30.GMxoMDJha-vJg0j32koiR8D2oNMUHs39bTs3LAw8cn4"
);

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 CONTROLE DE SESSÃO
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

  // 🔥 LIMPAR SESSÃO (corrige bug de usuário trocado)
  const limparSessao = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  // 🔐 LOGIN MELHORADO
  const login = async () => {
    if (!email) {
      alert("Digite um email válido");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      alert("Erro no login: " + error.message);
    } else {
      alert("Verifique seu email 📩");
    }
  };

  // 🤖 IA COM TRATAMENTO DE ERRO
  const falarComIA = async () => {
    if (!texto) {
      alert("Digite algo primeiro");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("https://neuro360-tkyx.onrender.com/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texto, emocao }),
      });

      if (!res.ok) {
        throw new Error("Erro no servidor");
      }

      const data = await res.json();

      setResposta(data.resposta || "Sem resposta da IA");
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com IA");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 TELA LOGIN
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h1>NeuroMapa360</h1>

        <input
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <button onClick={login}>Entrar / Cadastrar</button>
      </div>
    );
  }

  // 🧠 TELA PRINCIPAL
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

      <button onClick={falarComIA}>
        {loading ? "Processando..." : "Falar com IA"}
      </button>

      <h3>Resposta:</h3>
      <p>{resposta}</p>
    </div>
  );
}
