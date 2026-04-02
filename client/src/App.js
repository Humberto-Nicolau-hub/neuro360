import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔐 SUPABASE (ANON KEY)
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

// 👑 ADMIN
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";

function App() {

  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [estado, setEstado] = useState("");
  const [texto, setTexto] = useState("");

  const [respostaIA, setRespostaIA] = useState("");
  const [meta, setMeta] = useState("");
  const [trilha, setTrilha] = useState("");

  const [progresso, setProgresso] = useState(0);
  const [metaTotal, setMetaTotal] = useState(3);

  const [streak, setStreak] = useState(0);

  const [premium, setPremium] = useState(false);

  const estados = [
    "Ansioso","Desmotivado","Sem foco","Cansado","Triste",
    "Irritado","Com medo","Confuso","Sobrecarregado",
    "Procrastinando","Inseguro","Frustrado"
  ];

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      setUsuario(data.user);

      if (data.user.email === ADMIN_EMAIL) {
        setPremium(true);
      }
    }
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      alert(error.message);
      return;
    }

    setUsuario(data.user);

    if (data.user.email === ADMIN_EMAIL) {
      setPremium(true);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  // 🤖 IA
  async function falarComIA() {
    const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensagem: texto + " " + estado,
        email: usuario.email
      })
    });

    const data = await res.json();

    setRespostaIA(data.resposta || "");
    setMeta(data.meta || "");
    setTrilha(data.trilha || "");
    setStreak(data.streak || 0);

    // 🔥 duração da meta
    if (data.meta?.includes("5")) setMetaTotal(5);
    else setMetaTotal(3);

    setProgresso(0);
  }

  // ✅ CHECK DIÁRIO
  function completarDia() {
    if (progresso < metaTotal) {
      setProgresso(progresso + 1);
    }
  }

  // 📊 BARRA VISUAL
  function barraProgresso() {
    let cheio = "█".repeat(progresso);
    let vazio = "░".repeat(metaTotal - progresso);
    return cheio + vazio;
  }

  // 🔐 LOGIN SCREEN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>NeuroMapa360</h1>

        <input
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        /><br /><br />

        <input
          type="password"
          placeholder="Senha"
          onChange={e => setSenha(e.target.value)}
        /><br /><br />

        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  // 🚀 APP
  return (
    <div style={{ textAlign: "center", padding: 20 }}>

      <h1>🚀 NeuroMapa360</h1>
      <p>{usuario.email}</p>

      <button onClick={logout}>Sair</button>

      <br /><br />

      <button style={{ background: "gold" }}>
        ⭐ {premium ? "Premium Ativo" : "Ativar Premium"}
      </button>

      <hr />

      <h3>Como você está se sentindo?</h3>

      <select onChange={e => setEstado(e.target.value)}>
        <option>Selecione</option>
        {estados.map((e, i) => (
          <option key={i}>{e}</option>
        ))}
      </select>

      <br /><br />

      <textarea
        placeholder="Descreva o que está sentindo..."
        value={texto}
        onChange={e => setTexto(e.target.value)}
      />

      <br /><br />

      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      {meta && (
        <>
          <h2>🎯 Meta</h2>
          <p>{meta}</p>

          <h3>📊 Progresso: {progresso}/{metaTotal}</h3>
          <p>{barraProgresso()}</p>

          <button onClick={completarDia}>
            ✅ Completei hoje
          </button>

          <h3>🔥 Sequência: {streak} dias</h3>
        </>
      )}

      {trilha && (
        <>
          <h2>🚀 Trilha</h2>
          <p>{trilha}</p>
        </>
      )}

      <hr />

      <h3>🤖 Resposta da IA</h3>
      <p style={{ whiteSpace: "pre-line" }}>
        {respostaIA}
      </p>

    </div>
  );
}

export default App;
