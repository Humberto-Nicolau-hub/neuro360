import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {
  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);
  const [recomendacao, setRecomendacao] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [limiteAtingido, setLimiteAtingido] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // 🔐 ADMIN
  const [modoAdmin, setModoAdmin] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");

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

  // 🔐 ACESSAR ADMIN
  function acessarAdmin() {
    if (senhaAdmin === "123456") {
      setModoAdmin(true);
      buscarTodosDados();
    } else {
      alert("Senha incorreta");
    }
  }

  // 📊 BUSCAR TODOS OS DADOS (ADMIN)
  async function buscarTodosDados() {
    const { data } = await supabase.from("feedbacks").select("*");

    const lista = data || [];
    setDados(lista);

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
  }

  async function salvarDados() {
    if (!usuario) return;

    if (dados.length >= 5 && !modoAdmin) {
      setLimiteAtingido(true);
      return;
    }

    const trilhas = ["Ansiedade", "Foco", "Autoestima"];
    const trilhaEscolhida = trilhas[Math.floor(Math.random() * trilhas.length)];

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        trilha: trilhaEscolhida,
        eficaz: Math.random() > 0.3,
        comentario: "Registro automático"
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

    if (lista.length >= 5) {
      setLimiteAtingido(true);
    }

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });
  }, []);

  useEffect(() => {
    if (usuario && !modoAdmin) {
      buscarDados();
    }
  }, [usuario]);

  // 🔐 LOGIN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>🔐 Login NeuroMapa360</h1>

        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <br /><br />

        <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />
        <br /><br />

        <button onClick={login}>Entrar</button>
        <button onClick={cadastro}>Cadastrar</button>
      </div>
    );
  }

  // 🔐 ACESSO ADMIN
  if (!modoAdmin) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>🚀 NeuroMapa360</h1>

        <p>Logado como: {usuario.email}</p>
        <button onClick={logout}>Sair</button>

        <br /><br />

        <input
          placeholder="Senha Admin"
          onChange={e => setSenhaAdmin(e.target.value)}
        />
        <button onClick={acessarAdmin}>Entrar no Admin</button>

        <br /><br />

        {limiteAtingido && (
          <div style={{ color: "red" }}>
            🔒 Limite gratuito atingido
          </div>
        )}

        <button onClick={salvarDados}>
          Gerar novo registro
        </button>

        <h2>🧠 Recomendação</h2>
        <p>{recomendacao}</p>

        <BarChart width={300} height={300} data={grafico}>
          <XAxis dataKey="trilha" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" />
        </BarChart>
      </div>
    );
  }

  // 📊 PAINEL ADMIN
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>📊 Painel Admin NeuroMapa360</h1>

      <button onClick={() => setModoAdmin(false)}>Voltar</button>

      <h2>Total de Registros: {dados.length}</h2>

      <BarChart width={400} height={300} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <h2>📋 Todos os Dados:</h2>

      {dados.map((item, index) => (
        <p key={index}>
          {item.usuario} - {item.trilha}
        </p>
      ))}
    </div>
  );
}
