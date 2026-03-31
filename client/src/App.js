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

  // 🔥 NOVO — SCORE EMOCIONAL
  const [scoreEmocional, setScoreEmocional] = useState(50);
  const [nivel, setNivel] = useState("Neutro");

  // LOGIN
  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      alert("Erro no login");
    } else {
      setUsuario(data.user);
    }
  }

  async function cadastro() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha
    });

    if (error) {
      alert("Erro ao cadastrar");
    } else {
      alert("Cadastro realizado!");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  function gerarTrilha() {
    if (estadoEmocional === "ansioso") return "Ansiedade";
    if (estadoEmocional === "desmotivado") return "Autoestima";
    if (estadoEmocional === "sem_foco") return "Foco";
    return "Autoconhecimento";
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

    let pontuacao = {};

    lista.forEach(item => {
      pontuacao[item.trilha] = (pontuacao[item.trilha] || 0) + 1;
      if (item.eficaz) pontuacao[item.trilha] += 3;
      if (item.estado === estadoEmocional) pontuacao[item.trilha] += 4;
    });

    let melhor = "";
    let maior = 0;

    Object.keys(pontuacao).forEach(trilha => {
      if (pontuacao[trilha] > maior) {
        maior = pontuacao[trilha];
        melhor = trilha;
      }
    });

    setRecomendacao(melhor);

    // 🔥 CALCULAR SCORE
    calcularScore(lista);
  }

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
      return data.resposta || "Sem resposta da IA.";

    } catch (error) {
      return "Erro ao conectar com o servidor.";
    }
  }

  async function enviarParaIA() {
    const resposta = await gerarRespostaIA(mensagemIA);
    setRespostaIA(resposta);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  useEffect(() => {
    if (usuario) {
      buscarDados();
    }
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

      <p>Logado como: {usuario.email}</p>
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
        Gerar Recomendação Inteligente
      </button>

      <h2>🧠 Recomendação:</h2>
      <p>{recomendacao}</p>

      {/* 🔥 SCORE EMOCIONAL */}
      <h2>📈 Evolução Emocional</h2>
      <p>Score: {scoreEmocional}/100</p>
      <p>Nível: {nivel}</p>

      <h2>📊 Gráfico</h2>

      <BarChart width={300} height={250} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <h3>Histórico:</h3>

      {dados.map((item, index) => (
        <p key={index}>
          {item.trilha} - {item.estado}
        </p>
      ))}

      <hr />

      <h2>🤖 Assistente Inteligente</h2>

      <input
        placeholder="Descreva como você está se sentindo..."
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
      />

      <br /><br />

      <button onClick={enviarParaIA}>
        Gerar orientação
      </button>

      <p style={{ marginTop: "20px" }}>
        {respostaIA}
      </p>
    </div>
  );
}
