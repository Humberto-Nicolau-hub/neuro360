import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "SUA_ANON_KEY_AQUI"
);

function App() {

  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [texto, setTexto] = useState("");

  const [resposta, setResposta] = useState("");
  const [perfil, setPerfil] = useState("");
  const [fase, setFase] = useState("");
  const [tendencia, setTendencia] = useState("");
  const [total, setTotal] = useState(0);

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) return alert("Erro login");

    setUsuario(data.user);
  }

  async function falarIA() {
    const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        mensagem: texto,
        email: usuario.email
      })
    });

    const data = await res.json();

    setResposta(data.resposta);
    setPerfil(data.perfil);
    setFase(data.fase);
    setTendencia(data.tendencia);
    setTotal(data.totalRegistros);
  }

  if (!usuario) {
    return (
      <div style={{ textAlign:"center", marginTop:100 }}>
        <h1>NeuroMapa360</h1>
        <input placeholder="Email" onChange={e=>setEmail(e.target.value)} /><br/><br/>
        <input type="password" placeholder="Senha" onChange={e=>setSenha(e.target.value)} /><br/><br/>
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign:"center", padding:20 }}>

      <h1>🚀 NeuroMapa360</h1>

      <textarea
        placeholder="Descreva seu estado..."
        onChange={e=>setTexto(e.target.value)}
      />

      <br/><br/>

      <button onClick={falarIA}>Analisar</button>

      <hr />

      <h2>📊 Dashboard</h2>
      <p>🧬 Perfil: {perfil}</p>
      <p>📍 Fase: {fase}</p>
      <p>📈 Tendência: {tendencia}</p>
      <p>📅 Registros: {total}</p>

      <hr />

      <h2>🧠 IA</h2>
      <p>{resposta}</p>

    </div>
  );
}

export default App;
