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

  async function salvarDados() {
    if (!usuario) {
      alert("Faça login primeiro");
      return;
    }

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
    data.forEach(item => {
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

    // 🧠 Recomendação
    let maisUsada = "";
    let maior = 0;

    Object.keys(agrupado).forEach(trilha => {
      if (agrupado[trilha] > maior) {
        maior = agrupado[trilha];
        maisUsada = trilha;
      }
    });

    setRecomendacao(maisUsada);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
    });

    buscarDados();
  }, []);

  // 🔐 TELA DE LOGIN
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
        Salvar novo feedback
      </button>

      <h2>🧠 Recomendação Inteligente</h2>
      <p>
        Trilha mais recomendada: <strong>{recomendacao}</strong>
      </p>

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
    </div>
  );
}
