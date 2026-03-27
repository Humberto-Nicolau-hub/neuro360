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

  // 🔐 LOGIN
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

  // 💰 SIMULAÇÃO DE PAGAMENTO
  function ativarPremium() {
    alert("Plano Premium ativado!");
    setPremium(true);
  }

  // 🎯 TRILHAS PERSONALIZADAS
  function gerarTrilhaPersonalizada() {
    if (estadoEmocional === "ansioso") return "Respiração e Calma";
    if (estadoEmocional === "desmotivado") return "Motivação e Energia";
    if (estadoEmocional === "sem_foco") return "Foco e Clareza";
    return "Autoconhecimento";
  }

  // 💾 SALVAR
  async function salvarDados() {

    if (!usuario) return;

    if (!premium && dados.length >= 5) {
      alert("🔒 Limite gratuito atingido. Faça upgrade.");
      return;
    }

    const trilha = gerarTrilhaPersonalizada();

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

  // 🔍 BUSCAR + IA
  async function buscarDados() {

    if (!usuario) return;

    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", usuario.email);

    const lista = data || [];
    setDados(lista);

    // gráfico
    const agrupado = {};
    lista.forEach(item => {
      agrupado[item.trilha] = (agrupado[item.trilha] || 0) + 1;
    });

    setGrafico(
      Object.keys(agrupado).map(k => ({
        trilha: k,
        total: agrupado[k]
      }))
    );

    // 🧠 IA AVANÇADA
    let pontuacao = {};

    lista.forEach(item => {

      pontuacao[item.trilha] = (pontuacao[item.trilha] || 0) + 1;

      if (item.eficaz) pontuacao[item.trilha] += 3;

      if (item.estado === estadoEmocional) {
        pontuacao[item.trilha] += 4;
      }

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
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  useEffect(() => {
    if (usuario) buscarDados();
  }, [usuario, estadoEmocional]);

  // 🔐 LOGIN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>NeuroMapa360</h1>

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
    <div style={{ textAlign: "center", marginTop: "40px" }}>

      <h1>NeuroMapa360</h1>

      <p>{usuario.email}</p>
      <button onClick={logout}>Sair</button>

      <br /><br />

      {/* 💰 UPGRADE */}
      {!premium && (
        <button onClick={ativarPremium}>
          🔓 Ativar Plano Premium
        </button>
      )}

      <br /><br />

      {/* 🧠 ESTADO EMOCIONAL */}
      <select onChange={(e) => setEstadoEmocional(e.target.value)}>
        <option value="">Como você está se sentindo?</option>
        <option value="ansioso">Ansioso</option>
        <option value="desmotivado">Desmotivado</option>
        <option value="sem_foco">Sem foco</option>
      </select>

      <br /><br />

      <button onClick={salvarDados}>
        Gerar recomendação
      </button>

      <h2>🧠 Recomendação:</h2>
      <p><strong>{recomendacao}</strong></p>

      <BarChart width={300} height={300} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <h3>Histórico:</h3>

      {dados.map((item, i) => (
        <p key={i}>
          {item.trilha} - {item.estado}
        </p>
      ))}

    </div>
  );
}
