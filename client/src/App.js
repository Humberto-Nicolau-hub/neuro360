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

  useEffect(() => {
    verificarUsuario();
  }, []);

  useEffect(() => {
    if (user) {
      carregarHistorico();
      garantirUsuario();
    }
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      alert("Erro ao cadastrar");
      return;
    }

    const userId = data.user.id;

    await supabase.from("usuarios").insert([
      {
        id: userId,
        email,
        plano: "free",
        limite_diario: 5,
      },
    ]);

    alert("Cadastro realizado!");
  }

  async function garantirUsuario() {
    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) {
      await supabase.from("usuarios").insert([
        {
          id: user.id,
          email: user.email,
          plano: "free",
          limite_diario: 5,
        },
      ]);
    }
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
      .eq("user_id", user.id);

    setHistorico(data || []);
  }

  async function enviarTexto() {
    try {
      setLoading(true);

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      const hoje = new Date().toISOString().split("T")[0];

      const { data: usosHoje } = await supabase
        .from("registros_emocionais")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", hoje);

      if (
        usuario?.plano === "free" &&
        usosHoje.length >= usuario.limite_diario
      ) {
        setResposta("🚫 Limite diário atingido.");
        return;
      }

      const score = SCORE_MAP[emocao] || 0;

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texto, emocao, score }),
      });

      const json = await res.json();

      setResposta(json?.resposta || "Sem resposta");

      await salvarRegistro(score);
      await carregarHistorico();

      setTexto("");

    } catch (err) {
      setResposta("Erro ao conectar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <>
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" onChange={(e) => setSenha(e.target.value)} />
          <button onClick={login}>Entrar</button>
          <button onClick={cadastrar}>Cadastrar</button>
        </>
      ) : (
        <>
          <p>{user.email}</p>
          <button onClick={logout}>Sair</button>

          <select onChange={(e) => setEmocao(e.target.value)}>
            <option>Motivado</option>
            <option>Feliz</option>
            <option>Neutro</option>
            <option>Ansioso</option>
            <option>Triste</option>
          </select>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          <button onClick={enviarTexto}>
            {loading ? "..." : "Enviar"}
          </button>

          <p>{resposta}</p>

          <button onClick={() => alert("Premium em breve 💎")}>
            Upgrade
          </button>
        </>
      )}
    </div>
  );
}

export default App;
