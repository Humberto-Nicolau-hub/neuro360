
import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {
  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [recomendacao, setRecomendacao] = useState("");
  const [usuario, setUsuario] = useState(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // 🔐 LOGIN
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

  // 🆕 CADASTRO
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

  // 🚪 LOGOUT
  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  // 💾 SALVAR DADOS COM TRILHA ALEATÓRIA
  async function salvarDados() {
    if (!usuario) {
      alert("Faça login primeiro");
      return;
    }

    const trilhas = ["Ansiedade", "Foco", "Autoestima"];
    const trilhaEscolhida = trilhas[Math.floor(Math.random() * trilhas.length)];

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        trilha: trilhaEscolhida,
        eficaz: Math.random() > 0.3, // simulação de eficácia
        comentario: "Registro automático"
      }
    ]);

    buscarDados();
  }

  // 🔍 BUSCAR DADOS + IA PERSONALIZADA
  async function buscarDados() {
    if (!usuario) return;

    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", usuario.email);

    const lista = data || [];
    setDados(lista);

    // 📊 GRÁFICO
    const agrupado = {};
    lista.forEach(item => {
      if (!agrupado[item.trilha]) {
        agrupado[item.trilha] = 0;
      }
      agrupado[item.trilha]++;
    });

    const formatado = Object.keys(agrupado).map(key => ({
      trilha: key,
      total: agrupado[key]
    }));

    setGrafico(formatado);

    // 🧠 IA PERSONALIZADA (NOVA)
    let pontuacao = {};

    lista.forEach(item => {
      if (!pontuacao[item.trilha]) {
        pontuacao[item.trilha] = 0;
      }

      pontuacao[item.trilha] += 1;

      if (item.eficaz) {
        pontuacao[item.trilha] += 2;
      }
    });

    let melhorTrilha = "";
    let maiorPontuacao = 0;

    Object.keys(pontuacao).forEach(trilha => {
      if (pontuacao[trilha] > maiorPontuacao) {
        maiorPontuacao = pontuacao[trilha];
        melhorTrilha = trilha;
      }
    });

    setRecomendacao(melhorTrilha);
  }

  // 🔄 CARREGAR USUÁRIO
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  // 🔄 BUSCAR DADOS APÓS LOGIN
  useEffect(() => {
    if (usuario) {
      buscarDados();
    }
  }, [usuario]);

  // 🔐 LOGIN UI
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>🔐 Login NeuroMapa360</h1>

        <input
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Senha"
          onChange={e => setSenha(e.target.value)}
        />
        <br /><br />

        <button onClick={login}>Entrar</button>
        <button onClick={cadastro}>Cadastrar</button>
      </div>
    );
  }

  // 🚀 APP PRINCIPAL
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚀 NeuroMapa360</h1>

      <p>Logado como: {usuario.email}</p>
      <button onClick={logout}>Sair</button>

      <br /><br />

      <button onClick={salvarDados}>
        Gerar novo registro inteligente
      </button>

      <h2>🧠 Recomendação Inteligente</h2>
      <p>
        Melhor trilha para você: <strong>{recomendacao}</strong>
      </p>

      <h2>📊 Gráfico de Trilhas</h2>

      <BarChart width={300} height={300} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <h2>📋 Seus Feedbacks:</h2>

      {dados.map((item, index) => (
        <p key={index}>
          {item.trilha} - {item.eficaz ? "Eficaz" : "Não eficaz"}
        </p>
      ))}
    </div>
  );
}
