import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line
} from "recharts";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_secret_t2-L_VPgsex6bxlVASiLNg_XD-F8tO3"
);

function App() {

  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [estado, setEstado] = useState("");
  const [mensagemIA, setMensagemIA] = useState("");
  const [respostaIA, setRespostaIA] = useState("");

  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [linhaTempo, setLinhaTempo] = useState([]);

  const [score, setScore] = useState(50);
  const [nivel, setNivel] = useState("Estável");
  const [streak, setStreak] = useState(0);
  const [foco, setFoco] = useState("");

  const [premium, setPremium] = useState(false);

  const opcoesEmocionais = [
    "Ansioso","Desmotivado","Sem foco","Cansado","Triste",
    "Irritado","Com medo","Confuso","Sobrecarregado",
    "Sem energia","Procrastinando","Desanimado","Inseguro","Frustrado"
  ];

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUsuario(data.user);
      buscarDados(data.user.email);
    }
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) return alert("Erro no login");

    setUsuario(data.user);
    buscarDados(data.user.email);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  async function buscarDados(emailUsuario) {
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", emailUsuario);

    const lista = data || [];
    setDados(lista);

    // gráfico
    const contagem = {};
    lista.forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    setGrafico(Object.keys(contagem).map(k => ({
      estado: k,
      total: contagem[k]
    })));

    // linha do tempo
    const porDia = {};
    lista.forEach(item => {
      const dia = item.created_at?.slice(0,10);
      porDia[dia] = (porDia[dia] || 0) + 1;
    });

    setLinhaTempo(Object.keys(porDia).map(d => ({
      dia: d,
      total: porDia[d]
    })));

    // score
    let novoScore = 50;
    lista.forEach(item => {
      if (item.eficaz) novoScore += 5;
      else novoScore -= 2;
    });

    novoScore = Math.max(0, Math.min(100, novoScore));
    setScore(novoScore);

    if (novoScore > 70) setNivel("Alta performance");
    else if (novoScore > 40) setNivel("Estável");
    else setNivel("Atenção");

    setStreak(lista.length);
  }

  function ativarPremium() {
    window.open("https://buy.stripe.com/test_00wbJ04be46146ecdqeZ200", "_blank");
  }

  async function salvar() {
    if (!estado) return alert("Selecione um estado");

    if (!premium && dados.length >= 5) {
      alert("Limite gratuito atingido");
      return;
    }

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        estado: estado.toLowerCase(),
        trilha: foco,
        eficaz: true
      }
    ]);

    buscarDados(usuario.email);
  }

  async function falarComIA() {
    const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({
        mensagem: mensagemIA,
        email: usuario.email
      })
    });

    const data = await res.json();
    setRespostaIA(data.resposta);
  }

  // 🔥 TELA LOGIN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>NeuroMapa360</h1>

        <input
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        /><br/><br/>

        <input
          type="password"
          placeholder="Senha"
          onChange={(e)=>setSenha(e.target.value)}
        /><br/><br/>

        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 20 }}>

      <h1>🚀 NeuroMapa360</h1>
      <p>{usuario.email}</p>

      <button onClick={logout}>Sair</button>

      <br/><br/>

      <button onClick={ativarPremium} style={{ background: "gold", padding: 10 }}>
        ⭐ Ativar Premium
      </button>

      <hr />

      <h3>Como você está se sentindo?</h3>

      <select onChange={(e)=>setEstado(e.target.value)}>
        <option value="">Selecione</option>
        {opcoesEmocionais.map((o,i)=>(
          <option key={i}>{o}</option>
        ))}
      </select>

      <br/><br/>

      <textarea
        placeholder="Descreva..."
        onChange={(e)=>setMensagemIA(e.target.value)}
      />

      <br/><br/>

      <button onClick={salvar}>Salvar</button>
      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      <h2>{foco}</h2>

      <h3>📊 Evolução</h3>
      <p>Score: {score}</p>
      <p>Nível: {nivel}</p>

      <h3>🔥 Sequência</h3>
      <p>{streak} registros</p>

      <hr />

      <BarChart width={400} height={300} data={grafico}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="estado" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <hr />

      <LineChart width={400} height={300} data={linhaTempo}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dia" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" />
      </LineChart>

      <hr />

      <h3>🤖 IA</h3>
      <p style={{ whiteSpace: "pre-line" }}>{respostaIA}</p>

    </div>
  );
}

export default App;
