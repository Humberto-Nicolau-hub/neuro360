import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// 🔥 URL DO BACKEND
const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

// 🔥 SCORE
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

// 🔥 LANDING PAGE (EMBUTIDA)
function Landing({ onLogin }) {
  const irParaPagamento = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "cliente@teste.com",
        }),
      });

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      alert("Erro ao iniciar pagamento");
    }
  };

  return (
    <div style={{
      fontFamily: "Arial",
      padding: "40px",
      textAlign: "center",
      background: "#0f172a",
      color: "white",
      minHeight: "100vh"
    }}>
      <h1 style={{ fontSize: "40px" }}>
        🧠 Reprograme sua mente. Transforme sua vida.
      </h1>

      <p style={{ marginTop: "20px" }}>
        IA + PNL para reduzir ansiedade, eliminar crenças limitantes
        e evoluir emocionalmente todos os dias.
      </p>

      <button
        onClick={irParaPagamento}
        style={{
          marginTop: "30px",
          padding: "15px 30px",
          fontSize: "18px",
          background: "#22c55e",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        💎 Quero acessar o Premium
      </button>

      <br /><br />

      <button onClick={onLogin}>
        Já tenho conta
      </button>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Neutro");
  const [resposta, setResposta] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verificarUsuario();
  }, []);

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

    await supabase.from("usuarios").insert([
      {
        id: data.user.id,
        email,
        plano: "free",
        limite_diario: 5,
      },
    ]);

    alert("Cadastro realizado!");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function enviarTexto() {
    if (!texto.trim()) return;

    try {
      setLoading(true);

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

      setTexto("");

    } catch {
      setResposta("Erro");
    } finally {
      setLoading(false);
    }
  }

  // 🔥 LANDING
  if (!user && !mostrarLogin) {
    return <Landing onLogin={() => setMostrarLogin(true)} />;
  }

  // 🔥 LOGIN
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Senha"
          onChange={(e) => setSenha(e.target.value)}
        />
        <br /><br />

        <button onClick={login}>Entrar</button>
        <button onClick={cadastrar}>Cadastrar</button>
      </div>
    );
  }

  // 🔥 APP
  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      <p>{user.email}</p>
      <button onClick={logout}>Sair</button>

      <h3>Como você está se sentindo?</h3>

      <select onChange={(e) => setEmocao(e.target.value)}>
        <option>Motivado</option>
        <option>Feliz</option>
        <option>Neutro</option>
        <option>Ansioso</option>
        <option>Triste</option>
      </select>

      <br /><br />

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Descreva como você está..."
      />

      <br /><br />

      <button onClick={enviarTexto}>
        {loading ? "..." : "Enviar"}
      </button>

      <h3>Resposta</h3>
      <p>{resposta}</p>
    </div>
  );
}

export default App;
