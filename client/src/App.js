import React, { useState } from "react";
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
  const [relatorio, setRelatorio] = useState("");

  async function login() {
    const { data } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

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
  }

  async function verRelatorio() {
    const res = await fetch("https://neuro360-tkyx.onrender.com/relatorio", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        email: usuario.email
      })
    });

    const data = await res.json();
    setRelatorio(data.relatorio);
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
        placeholder="Fale com a IA..."
        onChange={e=>setTexto(e.target.value)}
      />

      <br/><br/>

      <button onClick={falarIA}>Falar com IA</button>
      <button onClick={verRelatorio}>📊 Ver meu relatório</button>

      <hr />

      <h2>🧠 IA</h2>
      <p>{resposta}</p>

      <hr />

      <h2>📊 Relatório</h2>
      <p>{relatorio}</p>

    </div>
  );
}

export default App;
