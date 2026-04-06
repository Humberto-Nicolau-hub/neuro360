import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [texto, setTexto] = useState("");
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

    if (error) {
      alert("Erro no login");
    } else {
      verificarUsuario();
    }
  }

  async function cadastrar() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      alert("Erro ao cadastrar");
    } else {
      alert("Cadastro realizado!");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function enviarTexto() {
    if (!texto.trim()) {
      setResposta("⚠️ Digite algo antes de enviar");
      return;
    }

    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto }),
      });

      const json = await res.json();

      setResposta(json?.resposta || "Sem resposta");

      setTexto("");
    } catch (err) {
      setResposta("Erro ao conectar com IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <>
          <h3>Login / Cadastro</h3>

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
        </>
      ) : (
        <>
          <p>Logado como: {user.email}</p>
          <button onClick={logout}>Sair</button>

          <br /><br />

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Como você está se sentindo?"
            style={{ width: "300px", padding: "8px" }}
          />

          <br /><br />

          <button onClick={enviarTexto} disabled={loading}>
            {loading ? "Processando..." : "Falar com IA"}
          </button>

          <br /><br />

          <p><strong>Resposta:</strong></p>
          <p>{resposta}</p>
        </>
      )}
    </div>
  );
}

export default App;
