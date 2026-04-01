import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {

  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [recomendacao, setRecomendacao] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [estadoEmocional, setEstadoEmocional] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagemIA, setMensagemIA] = useState("");
  const [respostaIA, setRespostaIA] = useState("");

  const [scoreEmocional, setScoreEmocional] = useState(50);
  const [nivel, setNivel] = useState("Neutro");
  const [streak, setStreak] = useState(0);
  const [conquistas, setConquistas] = useState([]);

  async function login() {
    const { data } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });
    setUsuario(data.user);
  }

  async function cadastro() {
    await supabase.auth.signUp({ email, password: senha });
    alert("Cadastro realizado!");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  function gerarTrilha() {
    if (estadoEmocional === "ansioso") return "Ansiedade";
    if (estadoEmocional === "desmotivado") return "Motivação";
    if (estadoEmocional === "sem_foco") return "Foco";
    return "Autoconhecimento";
  }

  function atualizarStreak() {
    const hoje = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaAtividade");
    let streakAtual = parseInt(localStorage.getItem("streak")) || 0;

    if (!ultima) streakAtual = 1;
    else if (ultima !== hoje) {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);

      if (new Date(ultima).toDateString() === ontem.toDateString()) {
        streakAtual += 1;
      } else {
        streakAtual = 1;
      }
    }

    localStorage.setItem("ultimaAtividade", hoje);
    localStorage.setItem("streak", streakAtual);

    setStreak(streakAtual);
  }

  async function salvarDados() {
    if (!usuario) return;

    const trilha = gerarTrilha();

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        trilha,
        estado: estadoEmocional,
        eficaz: Math.random() > 0.3
      }
    ]);

    atualizarStreak();
    buscarDados();
  }

  async function buscarDados() {
    if (!usuario) return;

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

    setGrafico(Object.keys(agrupado).map(k => ({
      trilha: k,
      total: agrupado[k]
    })));

    setRecomendacao(lista.length ? lista[lista.length - 1].trilha : "");

    calcularScore(lista);
    verificarConquistas(lista);
  }

  function calcularScore(dados) {
    let score = 50;

    dados.forEach(item => {
      if (item.estado === "ansioso") score -= 2;
      if (item.estado === "desmotivado") score -= 2;
      if (item.estado === "sem_foco") score -= 1;
      if (item.estado === "calmo") score += 2;
    });

    score = Math.max(0, Math.min(100, score));

    let nivelAtual = "Neutro";
    if (score < 30) nivelAtual = "Crítico";
    else if (score < 50) nivelAtual = "Baixo";
    else if (score < 70) nivelAtual = "Estável";
    else nivelAtual = "Evoluindo";

    setScoreEmocional(score);
    setNivel(nivelAtual);
  }

  function verificarConquistas(lista) {
    let novas = [];

    if (lista.length >= 1) novas.push("🚀 Primeiro passo");
    if (lista.length >= 5) novas.push("🔥 Consistência inicial");
    if (lista.length >= 10) novas.push("🏆 Persistência");

    if (streak >= 3) novas.push("📅 3 dias seguidos");
    if (streak >= 7) novas.push("💪 1 semana firme");

    if (scoreEmocional >= 70) novas.push("🌟 Evoluindo");
    if (scoreEmocional >= 85) novas.push("🧠 Alta performance");

    setConquistas(novas);
  }

  async function enviarParaIA() {
    const resposta = await fetch("https://neuro360-tkyx.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mensagem: mensagemIA,
        email: usuario?.email
      })
    });

    const data = await resposta.json();
    setRespostaIA(data.resposta);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUsuario(data.user));
  }, []);

  useEffect(() => {
    const s = localStorage.getItem("streak");
    if (s) setStreak(parseInt(s));
  }, []);

  useEffect(() => {
    if (usuario) buscarDados();
  }, [usuario, estadoEmocional]);

  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>🧠 NeuroMapa360</h1>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} /><br /><br />
        <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} /><br /><br />
        <button onClick={login}>Entrar</button>
        <button onClick={cadastro}>Cadastrar</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>

      <h1>🚀 NeuroMapa360</h1>

      <select onChange={e => setEstadoEmocional(e.target.value)}>
        <option value="">Como você está se sentindo?</option>
        <option value="ansioso">Ansioso</option>
        <option value="triste">Triste</option>
        <option value="desmotivado">Desmotivado</option>
        <option value="sem_foco">Sem foco</option>
        <option value="cansado">Cansado</option>
        <option value="sobrecarregado">Sobrecarregado</option>
        <option value="com_medo">Com medo</option>
        <option value="com_raiva">Com raiva</option>
        <option value="confuso">Confuso</option>
        <option value="sem_proposito">Sem propósito</option>
        <option value="calmo">Calmo</option>
        <option value="focado">Focado</option>
        <option value="motivado">Motivado</option>
      </select>

      <br /><br />

      <textarea
        placeholder="Descreva o que está acontecendo..."
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
        style={{ width: "80%", height: 80 }}
      />

      <br /><br />

      <button onClick={salvarDados}>Salvar</button>
      <button onClick={enviarParaIA}>Falar com IA</button>

      <h2>{recomendacao}</h2>

      <h3>Score: {scoreEmocional} | {nivel}</h3>
      <h3>🔥 Streak: {streak}</h3>

      <h3>🏆 Conquistas</h3>
      {conquistas.map((c, i) => <p key={i}>{c}</p>)}

      <BarChart width={300} height={250} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <p>{respostaIA}</p>
    </div>
  );
}
