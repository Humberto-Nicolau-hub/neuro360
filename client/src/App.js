import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {

  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [recomendacao, setRecomendacao] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [estadoEmocional, setEstadoEmocional] = useState("");
  const [premium, setPremium] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagemIA, setMensagemIA] = useState("");
  const [respostaIA, setRespostaIA] = useState("");

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

  function ativarPremium() {
    window.open("https://buy.stripe.com/test_00wbJ04be46146ecdqeZ200", "_blank");
  }

  function gerarTrilha() {
    if (estadoEmocional === "ansioso") return "Respiração";
    if (estadoEmocional === "desmotivado") return "Motivação";
    if (estadoEmocional === "sem_foco") return "Foco";
    return "Autoconhecimento";
  }

  async function salvarDados() {
    if (!usuario) return;

    if (!premium && dados.length >= 5) {
      alert("🔒 Limite gratuito atingido");
      return;
    }

    const trilha = gerarTrilha();

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        trilha,
        estado: estadoEmocional,
        eficaz: Math.random() > 0.3
      }
    ]);

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

    // 📊 EVOLUÇÃO EMOCIONAL
    const evolucao = lista.map((item, index) => ({
      passo: index + 1,
      valor: item.eficaz ? 10 : 4
    }));

    setGrafico(evolucao);

    let melhor = "";
    if (lista.length > 0) {
      melhor = lista[lista.length - 1].trilha;
    }

    setRecomendacao(melhor);
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

    } catch (error) {
      return "Erro ao conectar com IA.";
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
    if (usuario) buscarDados();
  }, [usuario, estadoEmocional]);

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

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚀 NeuroMapa360</h1>

      <p>{usuario.email}</p>
      <button onClick={logout}>Sair</button>

      <br /><br />

      <button onClick={ativarPremium}>
        🔓 Ativar Premium
      </button>

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

      <BarChart width={300} height={250} data={grafico}>
        <XAxis dataKey="passo" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="valor" />
      </BarChart>

      <hr />

      <h2>🤖 Assistente</h2>

      <input
        placeholder="Digite como está se sentindo"
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
      />

      <br /><br />

      <button onClick={enviarParaIA}>
        Falar com IA
      </button>

      <p>{respostaIA}</p>
    </div>
  );
}
