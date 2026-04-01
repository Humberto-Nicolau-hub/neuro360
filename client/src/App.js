import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {

  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [estado, setEstado] = useState("");
  const [mensagemIA, setMensagemIA] = useState("");
  const [respostaIA, setRespostaIA] = useState("");

  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);

  // LOGIN
  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) alert("Erro no login");
    else setUsuario(data.user);
  }

  async function cadastro() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha
    });

    if (error) alert("Erro ao cadastrar");
    else alert("Cadastro realizado!");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  // IA
  async function enviarParaIA() {
    const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mensagem: mensagemIA,
        email: usuario.email
      })
    });

    const data = await res.json();
    setRespostaIA(data.resposta);
  }

  // BUSCAR DADOS
  async function buscarDados() {
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", usuario.email);

    const lista = data || [];
    setDados(lista);

    const agrupado = {};
    lista.forEach(item => {
      agrupado[item.trilha] = (agrupado[item.trilha] || 0) + 1;
    });

    const formatado = Object.keys(agrupado).map(key => ({
      trilha: key,
      total: agrupado[key]
    }));

    setGrafico(formatado);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  useEffect(() => {
    if (usuario) buscarDados();
  }, [usuario]);

  // 🔐 TELA LOGIN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>🧠 NeuroMapa360</h1>

        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <br /><br />

        <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />
        <br /><br />

        <button onClick={login}>Entrar</button>
        <button onClick={cadastro}>Cadastrar</button>
      </div>
    );
  }

  // 🚀 DASHBOARD
  return (
    <div style={{ maxWidth: "700px", margin: "auto", textAlign: "center" }}>

      <h1>🚀 NeuroMapa360</h1>

      <p>{usuario.email}</p>
      <button onClick={logout}>Sair</button>

      <hr />

      {/* INPUT */}
      <h3>Como você está se sentindo?</h3>

      <select onChange={e => setEstado(e.target.value)}>
        <option value="">Selecione</option>
        <option value="ansioso">Ansioso</option>
        <option value="desmotivado">Desmotivado</option>
        <option value="sem_foco">Sem foco</option>
      </select>

      <br /><br />

      <textarea
        placeholder="Descreva o que você está sentindo..."
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
        style={{ width: "100%", height: "80px" }}
      />

      <br /><br />

      <button onClick={enviarParaIA}>Falar com IA</button>

      {/* 🧠 RESPOSTA */}
      {respostaIA && (
        <div style={{
          marginTop: "20px",
          padding: "15px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          background: "#f9f9f9"
        }}>
          <h3>🧠 Resposta da IA</h3>
          <p style={{ whiteSpace: "pre-line" }}>{respostaIA}</p>
        </div>
      )}

      <hr />

      {/* 📊 GRÁFICO */}
      <h3>📊 Evolução</h3>

      <BarChart width={400} height={250} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

    </div>
  );
}
