import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "SUA_CHAVE_PUBLICA_AQUI"
);

function App() {
  const [usuario, setUsuario] = useState({ email: "contatobetaoofertas@gmail.com" });

  const [estado, setEstado] = useState("");
  const [mensagemIA, setMensagemIA] = useState("");
  const [respostaIA, setRespostaIA] = useState("");

  const [dados, setDados] = useState([]);
  const [score, setScore] = useState(50);
  const [nivel, setNivel] = useState("Estável");
  const [streak, setStreak] = useState(0);
  const [foco, setFoco] = useState("");

  // 🔥 NOVAS EMOÇÕES (EXPANSÃO)
  const opcoesEmocionais = [
    "Ansioso",
    "Desmotivado",
    "Sem foco",
    "Cansado",
    "Triste",
    "Irritado",
    "Com medo",
    "Confuso",
    "Sobrecarregado",
    "Sem energia",
    "Procrastinando",
    "Desanimado",
    "Inseguro",
    "Frustrado"
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

    // 🧠 SCORE
    let novoScore = 50;

    lista.forEach(item => {
      if (item.eficaz) novoScore += 5;
      else novoScore -= 2;
    });

    if (novoScore > 100) novoScore = 100;
    if (novoScore < 0) novoScore = 0;

    setScore(novoScore);

    // 🔥 NÍVEL
    if (novoScore > 70) setNivel("Alta performance");
    else if (novoScore > 40) setNivel("Estável");
    else setNivel("Atenção");

    // 🔥 STREAK
    setStreak(lista.length);

    // 🎯 FOCO
    let focoAtual = "";

    if (estado === "Ansioso") focoAtual = "Calma";
    else if (estado === "Desmotivado") focoAtual = "Motivação";
    else if (estado === "Sem foco") focoAtual = "Clareza";
    else if (estado === "Cansado") focoAtual = "Recuperação";
    else if (estado === "Triste") focoAtual = "Equilíbrio emocional";
    else focoAtual = "Autoconhecimento";

    setFoco(focoAtual);
  }

  // 💾 SALVAR
  async function salvar() {
    if (!estado) return alert("Selecione um estado");

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

  // 🤖 IA
  async function falarComIA() {
    try {
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

    } catch (err) {
      setRespostaIA("Erro ao conectar com IA");
    }
  }

  return (
    <div style={{ textAlign: "center", padding: 20 }}>

      <h1>🚀 NeuroMapa360</h1>

      <p>{usuario.email}</p>

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
        rows={4}
        cols={40}
      />

      <br /><br />

      <button onClick={salvar}>Salvar</button>
      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      <h2>{foco}</h2>

      <h3>📊 Evolução Emocional</h3>

      <p><strong>Score:</strong> {score}/100</p>
      <p><strong>Nível:</strong> {nivel}</p>

      <h3>🔥 Sequência</h3>
      <p>{streak} registros</p>

      <hr />

      <h3>🤖 Resposta da IA</h3>
      <p style={{ whiteSpace: "pre-line" }}>{respostaIA}</p>

    </div>
  );
}

export default App;
