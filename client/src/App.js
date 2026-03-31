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

  // 🔥 SCORE
  const [scoreEmocional, setScoreEmocional] = useState(50);
  const [nivel, setNivel] = useState("Neutro");

  // 🔥 STREAK
  const [streak, setStreak] = useState(0);

  // 🔥 CONQUISTAS
  const [conquistas, setConquistas] = useState([]);

  // LOGIN
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

  // 🔥 STREAK
  function atualizarStreak() {
    const hoje = new Date().toDateString();
    const ultima = localStorage.getItem("ultimaAtividade");
    let streakAtual = parseInt(localStorage.getItem("streak")) || 0;

    if (!ultima) {
      streakAtual = 1;
    } else if (ultima === hoje) {
      // mantém
    } else {
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

    const formatado = Object.keys(agrupado).map(key => ({
      trilha: key,
      total: agrupado[key]
    }));

    setGrafico(formatado);

    let melhor = "";
    if (lista.length > 0) {
      melhor = lista[lista.length - 1].trilha;
    }

    setRecomendacao(melhor);

    calcularScore(lista);
    verificarConquistas(lista);
  }

  // 🔥 SCORE
  function calcularScore(dados) {
    let score = 50;

    dados.forEach(item => {
      if (item.estado === "ansioso") score -= 2;
      if (item.estado === "desmotivado") score -= 2;
      if (item.estado === "sem_foco") score -= 1;
      if (item.estado === "calmo") score += 2;
    });

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    let nivelAtual = "Neutro";

    if (score < 30) nivelAtual = "Crítico";
    else if (score < 50) nivelAtual = "Baixo";
    else if (score < 70) nivelAtual = "Estável";
    else nivelAtual = "Evoluindo";

    setScoreEmocional(score);
    setNivel(nivelAtual);
  }

  // 🔥 CONQUISTAS
  function verificarConquistas(lista) {
    let novas = [];

    if (lista.length >= 1) novas.push("🚀 Primeiro passo");
    if (lista.length >= 5) novas.push("🔥 Consistência inicial");
    if (lista.length >= 10) novas.push("🏆 Persistência");

    if (streak >= 3) novas.push("📅 3 dias seguidos");
    if (streak >= 7) novas.push("💪 1 semana firme");

    if (scoreEmocional >= 70) novas.push("🌟 Evoluindo emocionalmente");
    if (scoreEmocional >= 85) novas.push("🧠 Alta performance emocional");

    setConquistas(novas);
  }

  async function gerarRespostaIA(textoUsuario) {
    try {
      const resposta = await fetch("https://neuro360-tkyx.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem: textoUsuario,
          email: usuario?.email
        })
      });

      const data = await resposta.json();
      return data.resposta;

    } catch {
      return "Erro ao conectar com IA";
    }
  }

  async function enviarParaIA() {
    const resposta = await gerarRespostaIA(mensagemIA);
    setRespostaIA(resposta);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUsuario(data.user));
  }, []);

  useEffect(() => {
    const streakSalvo = localStorage.getItem("streak");
    if (streakSalvo) setStreak(parseInt(streakSalvo));
  }, []);

  useEffect(() => {
    if (usuario) buscarDados();
  }, [usuario, estadoEmocional]);

  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
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

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h1>🚀 NeuroMapa360</h1>

      <p>{usuario.email}</p>
      <button onClick={logout}>Sair</button>

      <br /><br />

      <select onChange={e => setEstadoEmocional(e.target.value)}>
        <option value="">Como você está se sentindo?</option>
        <option value="ansioso">Ansioso</option>
        <option value="desmotivado">Desmotivado</option>
        <option value="sem_foco">Sem foco</option>
      </select>

      <br /><br />

      <button onClick={salvarDados}>
        Gerar Recomendação
      </button>

      <h2>{recomendacao}</h2>

      <h2>📈 Evolução Emocional</h2>
      <p>Score: {scoreEmocional}/100</p>
      <p>Nível: {nivel}</p>

      <h2>🔥 Sequência</h2>
      <p>{streak} dias seguidos</p>

      <h2>🏆 Conquistas</h2>
      {conquistas.length === 0 && <p>Nenhuma ainda</p>}
      {conquistas.map((c, i) => (
        <p key={i}>{c}</p>
      ))}

      <BarChart width={300} height={250} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <hr />

      <h2>🤖 Assistente</h2>

      <input
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
        placeholder="Como você está se sentindo?"
      />

      <br /><br />

      <button onClick={enviarParaIA}>
        Falar com IA
      </button>

      <p>{respostaIA}</p>
    </div>
  );
}
