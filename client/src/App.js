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

  async function login() {
    const { data } = await supabase.auth.signInWithPassword({ email, password: senha });
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
    alert("Plano Premium ativado!");
    setPremium(true);
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
    lista.forEach(i => {
      agrupado[i.trilha] = (agrupado[i.trilha] || 0) + 1;
    });

    setGrafico(
      Object.keys(agrupado).map(k => ({
        trilha: k,
        total: agrupado[k]
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUsuario(data.user));
  }, []);

  useEffect(() => {
    if (usuario) buscarDados();
  }, [usuario, estadoEmocional]);

  if (!usuario) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1>🧠 NeuroMapa360</h1>
          <p>Seu guia inteligente emocional</p>

          <input placeholder="Email" onChange={e => setEmail(e.target.value)} style={styles.input}/>
          <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} style={styles.input}/>

          <button onClick={login} style={styles.primary}>Entrar</button>
          <button onClick={cadastro} style={styles.secondary}>Cadastrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <h2>NeuroMapa360</h2>
        <div>
          <span>{usuario.email}</span>
          <button onClick={logout} style={styles.logout}>Sair</button>
        </div>
      </div>

      {!premium && (
        <div style={styles.premiumBox}>
          <p>🔓 Desbloqueie recomendações ilimitadas</p>
          <button onClick={ativarPremium} style={styles.primary}>
            Ativar Premium
          </button>
        </div>
      )}

      <div style={styles.card}>
        <h3>Como você está se sentindo?</h3>

        <select onChange={e => setEstadoEmocional(e.target.value)} style={styles.input}>
          <option value="">Selecione</option>
          <option value="ansioso">Ansioso</option>
          <option value="desmotivado">Desmotivado</option>
          <option value="sem_foco">Sem foco</option>
        </select>

        <button onClick={salvarDados} style={styles.primary}>
          Gerar Recomendação Inteligente
        </button>
      </div>

      <div style={styles.card}>
        <h3>🧠 Sua recomendação</h3>
        <h2>{recomendacao || "..."}</h2>
      </div>

      <div style={styles.card}>
        <h3>📊 Seu progresso</h3>
        <BarChart width={300} height={250} data={grafico}>
          <XAxis dataKey="trilha" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" />
        </BarChart>
      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 400,
    margin: "auto",
    fontFamily: "Arial"
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: 100
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    border: "1px solid #ccc"
  },
  primary: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: 8
  },
  secondary: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#eee",
    border: "none",
    borderRadius: 8
  },
  logout: {
    marginLeft: 10
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },
  premiumBox: {
    background: "#ffe082",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "center"
  }
};
