import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line
} from "recharts";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "SUA_CHAVE_PUBLICA_AQUI"
);

function App() {

  const [usuario] = useState({ email: "contatobetaoofertas@gmail.com" });

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
    buscarDados();
  }, []);

  async function buscarDados() {
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", usuario.email);

    const lista = data || [];
    setDados(lista);

    // 🔥 GRÁFICO BARRAS
    const contagem = {};
    lista.forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    const dadosGrafico = Object.keys(contagem).map(key => ({
      estado: key,
      total: contagem[key]
    }));

    setGrafico(dadosGrafico);

    // 🔥 LINHA DO TEMPO
    const porDia = {};

    lista.forEach(item => {
      const dia = item.created_at
        ? item.created_at.slice(0, 10)
        : "sem-data";

      porDia[dia] = (porDia[dia] || 0) + 1;
    });

    const dadosLinha = Object.keys(porDia).map(dia => ({
      dia,
      total: porDia[dia]
    }));

    setLinhaTempo(dadosLinha);

    // 🔥 SCORE
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

    let focoAtual = "Autoconhecimento";

    if (estado === "Ansioso") focoAtual = "Calma";
    else if (estado === "Desmotivado") focoAtual = "Motivação";
    else if (estado === "Sem foco") focoAtual = "Clareza";
    else if (estado === "Cansado") focoAtual = "Recuperação";
    else if (estado === "Com medo") focoAtual = "Segurança";

    setFoco(focoAtual);
  }

  function ativarPremium() {
    window.open("https://buy.stripe.com/test_00wbJ04be46146ecdqeZ200", "_blank");
  }

  async function salvar() {
    if (!estado) return alert("Selecione um estado");

    if (!premium && dados.length >= 5) {
      alert("🔒 Limite gratuito atingido. Ative o Premium.");
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

    buscarDados();
  }

  async function falarComIA() {
    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: mensagemIA,
          email: usuario.email
        })
      });

      const data = await res.json();
      setRespostaIA(data.resposta);

    } catch {
      setRespostaIA("Erro ao conectar com IA");
    }
  }

  return (
    <div style={{ textAlign: "center", padding: 20 }}>

      <h1>🚀 NeuroMapa360</h1>
      <p>{usuario.email}</p>

      <button onClick={ativarPremium} style={{ background: "gold", padding: 10 }}>
        ⭐ Ativar Premium
      </button>

      <hr />

      <h3>Como você está se sentindo?</h3>

      <select onChange={(e) => setEstado(e.target.value)}>
        <option value="">Selecione</option>
        {opcoesEmocionais.map((item, i) => (
          <option key={i}>{item}</option>
        ))}
      </select>

      <br /><br />

      <textarea
        placeholder="Descreva o que você está sentindo..."
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
      />

      <br /><br />

      <button onClick={salvar}>Salvar</button>
      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      <h2>{foco}</h2>

      <h3>📊 Evolução Emocional</h3>
      <p>Score: {score}</p>
      <p>Nível: {nivel}</p>

      <h3>🔥 Sequência</h3>
      <p>{streak} registros</p>

      {!premium && (
        <p style={{ color: "red" }}>🔒 Plano gratuito limitado</p>
      )}

      <hr />

      {/* 📊 GRÁFICO BARRAS */}
      <h3>📊 Padrão emocional</h3>

      <BarChart width={400} height={300} data={grafico}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="estado" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <hr />

      {/* 📈 LINHA DO TEMPO */}
      <h3>📈 Evolução por dia</h3>

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
