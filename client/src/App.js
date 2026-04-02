import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line
} from "recharts";

// 🔐 SUPABASE
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

// 🔥 ADMIN
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";

function App() {

  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [estado, setEstado] = useState("");
  const [texto, setTexto] = useState(""); // 🔥 TEXTO REAL
  const [respostaIA, setRespostaIA] = useState("");

  const [meta, setMeta] = useState("");
  const [trilha, setTrilha] = useState("");

  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [linhaTempo, setLinhaTempo] = useState([]);

  const [score, setScore] = useState(50);
  const [nivel, setNivel] = useState("Estável");
  const [streak, setStreak] = useState(0);

  const [premium, setPremium] = useState(false);

  const estados = [
    "Ansioso","Desmotivado","Sem foco","Cansado","Triste",
    "Irritado","Com medo","Confuso","Sobrecarregado",
    "Sem energia","Procrastinando","Desanimado",
    "Inseguro","Frustrado"
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

      buscarDados(data.user.email);
    }
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    setUsuario(data.user);

    if (data.user.email === ADMIN_EMAIL) {
      setPremium(true);
    }

    buscarDados(data.user.email);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
    setPremium(false);
  }

  async function buscarDados(emailUsuario) {
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", emailUsuario);

    const lista = data || [];
    setDados(lista);

    const contagem = {};
    lista.forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    setGrafico(Object.keys(contagem).map(k => ({
      estado: k,
      total: contagem[k]
    })));

    const porDia = {};
    lista.forEach(item => {
      const dia = item.created_at?.slice(0,10);
      if (dia) porDia[dia] = (porDia[dia] || 0) + 1;
    });

    setLinhaTempo(Object.keys(porDia).map(d => ({
      dia: d,
      total: porDia[d]
    })));

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
    if (premium) {
      alert("Você já é Premium 🚀");
      return;
    }

    window.open("https://buy.stripe.com/test_00wbJ04be46146ecdqeZ200", "_blank");
  }

  async function salvar() {
    if (!estado) return alert("Selecione um estado");

    if (!premium && dados.length >= 5) {
      alert("Limite do plano gratuito atingido");
      return;
    }

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        estado: estado.toLowerCase(),
        trilha: trilha,
        eficaz: true
      }
    ]);

    buscarDados(usuario.email);
  }

  // 🔥 IA CORRIGIDA
  async function falarComIA() {
    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem: texto + " " + estado, // 🔥 CORREÇÃO AQUI
          email: usuario.email
        })
      });

      const data = await res.json();

      setRespostaIA(data.resposta);
      setMeta(data.meta || "");
      setTrilha(data.trilha || "");

    } catch (erro) {
      console.error(erro);
      setRespostaIA("Erro ao conectar com IA");
    }
  }

  // LOGIN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>NeuroMapa360</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        /><br/><br/>

        <input
          type="password"
          placeholder="Senha"
          value={senha}
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
        ⭐ {premium ? "Premium Ativo" : "Ativar Premium"}
      </button>

      <hr />

      <h3>Como você está se sentindo?</h3>

      <select onChange={(e)=>setEstado(e.target.value)}>
        <option value="">Selecione</option>
        {estados.map((e,i)=>(
          <option key={i}>{e}</option>
        ))}
      </select>

      <br/><br/>

      <textarea
        placeholder="Descreva o que você está sentindo..."
        value={texto}
        onChange={(e)=>setTexto(e.target.value)}
        style={{ width: "300px", height: "80px" }}
      />

      <br/><br/>

      <button onClick={salvar}>Salvar</button>
      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      {meta && (
        <>
          <h2>🎯 Meta</h2>
          <p>{meta}</p>
        </>
      )}

      {trilha && (
        <>
          <h2>🚀 Trilha</h2>
          <p>{trilha}</p>
        </>
      )}

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

      <h3>🤖 Resposta da IA</h3>
      <p style={{ whiteSpace: "pre-line" }}>{respostaIA}</p>

    </div>
  );
}

export default App;
