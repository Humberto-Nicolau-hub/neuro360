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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) alert("Erro no login");
    else setUsuario(data.user);
  }

  async function cadastro() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha
    });

    if (error) alert("Erro ao cadastrar");
    else alert("Cadastro realizado!");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUsuario(null);
  }

  function ativarPremium() {
    window.open("https://buy.stripe.com/test_00wbJ04be46146ecdqeZ200", "_blank");
  }

  function gerarTrilha() {
    if (estadoEmocional === "ansioso") return "Respiração e Calma";
    if (estadoEmocional === "desmotivado") return "Motivação e Energia";
    if (estadoEmocional === "sem_foco") return "Foco e Clareza";
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

    const agrupado = {};
    lista.forEach(item => {
      agrupado[item.trilha] = (agrupado[item.trilha] || 0) + 1;
    });

    setGrafico(
      Object.keys(agrupado).map(key => ({
        trilha: key,
        total: agrupado[key]
      }))
    );

    let pontuacao = {};

    lista.forEach(item => {
      pontuacao[item.trilha] = (pontuacao[item.trilha] || 0) + 1;
      if (item.eficaz) pontuacao[item.trilha] += 3;
      if (item.estado === estadoEmocional) pontuacao[item.trilha] += 4;
    });

    let melhor = "";
    let maior = 0;

    Object.keys(pontuacao).forEach(t => {
      if (pontuacao[t] > maior) {
        maior = pontuacao[t];
        melhor = t;
      }
    });

    setRecomendacao(melhor);
  }

  async function verificarPremium() {
    const { data } = await supabase
      .from("feedbacks")
      .select("premium")
      .eq("usuario", usuario.email);

    if (data && data.some(item => item.premium)) {
      setPremium(true);
    }
  }

  // IA SIMPLES (SEGURA)
  function gerarRespostaIA(texto) {
    if (!texto) return "Me diga como você está se sentindo.";

    if (texto.includes("ansioso"))
      return "Respire fundo. Foque no presente. Você está seguro.";

    if (texto.includes("triste"))
      return "Permita-se sentir, mas não se prenda a isso.";

    if (texto.includes("perdido"))
      return "Dê um pequeno passo agora. Clareza vem com ação.";

    return "Estou aqui com você. Continue se observando.";
  }

  function enviarParaIA() {
    const resposta = gerarRespostaIA(mensagemIA.toLowerCase());
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
      verificarPremium();
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

      <p>{usuario.email}</p>
      <button onClick={logout}>Sair</button>

      {!premium && (
        <div>
          <h3>🔒 Área Premium</h3>
          <button onClick={ativarPremium}>Ativar Premium</button>
        </div>
      )}

      <br />

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
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <hr />

      <h2>🤖 Assistente</h2>

      <input
        placeholder="Digite como você está..."
        value={mensagemIA}
        onChange={(e) => setMensagemIA(e.target.value)}
      />

      <br /><br />

      <button onClick={enviarParaIA}>
        Gerar resposta
      </button>

      <p>{respostaIA}</p>

    </div>
  );
}
