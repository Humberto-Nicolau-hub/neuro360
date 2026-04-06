import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

const SCORE_MAP = {
  Motivado: 2,
  Feliz: 2,
  Produtivo: 1,
  Neutro: 0,
  Ansioso: -1,
  Desmotivado: -2,
  Triste: -2,
  Cansado: -1,
};

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Neutro");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [scoreTotal, setScoreTotal] = useState(0);

  useEffect(() => {
    verificarUsuario();
  }, []);

  useEffect(() => {
    if (user) carregarHistorico();
  }, [user]);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) alert("Erro no login");
    else verificarUsuario();
  }

  async function cadastrar() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) alert("Erro ao cadastrar");
    else alert("Cadastro realizado!");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function salvarRegistro(score) {
    await supabase.from("registros_emocionais").insert([
      {
        user_id: user.id,
        emocao,
        texto,
        score,
      },
    ]);
  }

  async function carregarHistorico() {
    const { data } = await supabase
      .from("registros_emocionais")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    setHistorico(data || []);

    const total = (data || []).reduce((acc, item) => acc + item.score, 0);
    setScoreTotal(total);
  }

  async function enviarTexto() {
    if (!texto.trim()) {
      setResposta("⚠️ Digite algo antes de enviar");
      return;
    }

    try {
      setLoading(true);

      const score = SCORE_MAP[emocao] || 0;

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      const tendencia =
        historico.length > 0
          ? historico.reduce((acc, item) => acc + item.score, 0) /
            historico.length
          : 0;

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto,
          emocao,
          score,
          tendencia,
        }),
      });

      const json = await res.json();

      setResposta(json?.resposta || "Sem resposta");

      await salvarRegistro(score);
      await carregarHistorico();

      setTexto("");

    } catch (err) {
      setResposta("Erro ao conectar com IA");
    } finally {
      setLoading(false);
    }
  }

  function gerarGrafico() {
    return historico.map((item, i) => (
      <div key={i} style={{
        width: 10,
        height: 50 + item.score * 10,
        background: item.score >= 0 ? "green" : "red",
        display: "inline-block",
        marginRight: 5
      }} />
    ));
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <>
          <h3>Login / Cadastro</h3>

          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <br /><br />

          <input type="password" placeholder="Senha" onChange={(e) => setSenha(e.target.value)} />
          <br /><br />

          <button onClick={login}>Entrar</button>
          <button onClick={cadastrar}>Cadastrar</button>
        </>
      ) : (
        <>
          <p><strong>{user.email}</strong></p>
          <button onClick={logout}>Sair</button>

          <h3>Como você está se sentindo?</h3>

          <select onChange={(e) => setEmocao(e.target.value)} value={emocao}>
            <option>Motivado</option>
            <option>Feliz</option>
            <option>Produtivo</option>
            <option>Neutro</option>
            <option>Ansioso</option>
            <option>Desmotivado</option>
            <option>Triste</option>
            <option>Cansado</option>
          </select>

          <br /><br />

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva como você está..."
          />

          <br /><br />

          <button onClick={enviarTexto} disabled={loading}>
            {loading ? "Processando..." : "Falar com IA"}
          </button>

          <h3>📊 Score Total: {scoreTotal}</h3>

          <h3>📈 Evolução</h3>
          {gerarGrafico()}

          <h3>🧠 Resposta da IA</h3>
          <p>{resposta}</p>
        </>
      )}
    </div>
  );
}

export default App;
