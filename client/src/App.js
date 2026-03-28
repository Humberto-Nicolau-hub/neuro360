import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const OPENAI_API_KEY = "SUA_CHAVE_AQUI";

export default function App() {
  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [premium, setPremium] = useState(false);

  // IA
  const [mensagem, setMensagem] = useState("");
  const [respostaIA, setRespostaIA] = useState("");

  // =========================
  // LOGIN
  // =========================
  async function login() {
    const email = prompt("Digite seu email:");
    await supabase.auth.signInWithOtp({ email });
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  // =========================
  // IA
  // =========================
  async function gerarRespostaIA(textoUsuario) {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em PNL e desenvolvimento emocional. Ajude com clareza, acolhimento e direcionamento prático."
          },
          {
            role: "user",
            content: textoUsuario
          }
        ]
      })
    });

    const data = await resposta.json();
    return data.choices[0].message.content;
  }

  async function enviarParaIA() {
    const resposta = await gerarRespostaIA(mensagem);
    setRespostaIA(resposta);
  }

  // =========================
  // STRIPE
  // =========================
  function ativarPremium() {
    window.open("COLE_SEU_LINK_STRIPE_AQUI", "_blank");
  }

  // =========================
  // DADOS
  // =========================
  async function salvarDados() {
    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        trilha: "Ansiedade",
        eficaz: true,
        comentario: "Teste funcionando"
      }
    ]);

    buscarDados();
  }

  async function buscarDados() {
    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", usuario.email);

    setDados(data);

    const agrupado = {};
    data.forEach((item) => {
      if (!agrupado[item.trilha]) {
        agrupado[item.trilha] = 0;
      }
      agrupado[item.trilha]++;
    });

    const formatado = Object.keys(agrupado).map((key) => ({
      trilha: key,
      total: agrupado[key]
    }));

    setGrafico(formatado);
  }

  async function verificarPremium() {
    const { data } = await supabase
      .from("feedbacks")
      .select("premium")
      .eq("usuario", usuario.email);

    if (data && data.some((item) => item.premium)) {
      setPremium(true);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  useEffect(() => {
    if (usuario) {
      buscarDados();
      verificarPremium();
    }
  }, [usuario]);

  // =========================
  // TELA
  // =========================
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>🚀 NeuroMapa360</h1>
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚀 NeuroMapa360</h1>

      <p>Logado como: {usuario.email}</p>

      <button onClick={logout}>Sair</button>

      {!premium && (
        <div>
          <h2>🔒 Área Premium</h2>
          <button onClick={ativarPremium}>Ativar Premium</button>
        </div>
      )}

      <br />

      <button onClick={salvarDados}>Salvar novo feedback</button>

      <h2>📊 Gráfico de Trilhas</h2>

      <BarChart width={300} height={300} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <h2>📋 Feedbacks:</h2>

      {dados.map((item, index) => (
        <p key={index}>
          {item.usuario} - {item.trilha}
        </p>
      ))}

      {/* ================= IA ================= */}

      {premium && (
        <div style={{ marginTop: "40px" }}>
          <h2>🧠 IA Inteligente</h2>

          <input
            placeholder="Como você está se sentindo?"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />

          <br />
          <br />

          <button onClick={enviarParaIA}>
            Gerar orientação
          </button>

          <p style={{ marginTop: "20px" }}>{respostaIA}</p>
        </div>
      )}
    </div>
  );
}
