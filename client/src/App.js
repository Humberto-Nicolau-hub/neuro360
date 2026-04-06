import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://SEU-BACKEND.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");
  const [historico, setHistorico] = useState([]);
  const [score, setScore] = useState(0);
  const [nivel, setNivel] = useState("");

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) carregarHistorico();
  }

  async function carregarHistorico() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    const res = await fetch(`${BACKEND_URL}/dados`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setHistorico(data);
    calcularScore(data);
  }

  function calcularScore(lista) {
    let total = 0;

    lista.forEach((item) => {
      const t = item.estado.toLowerCase();

      if (t.includes("ansioso") || t.includes("triste")) total -= 1;
      else if (t.includes("feliz") || t.includes("motivado")) total += 1;
    });

    const media = lista.length ? total / lista.length : 0;
    setScore(media);

    if (media < -0.5) setNivel("🔴 Instável");
    else if (media < 0) setNivel("🟡 Em progresso");
    else if (media < 0.5) setNivel("🟢 Equilíbrio");
    else setNivel("🔵 Alta performance");
  }

  async function enviarTexto() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto }),
      });

      const data = await res.json();

      if (data?.resposta) {
        setResposta(data.resposta);
      } else {
        setResposta("⚠️ Nenhuma resposta recebida da IA");
      }

      setTexto("");
      carregarHistorico();

    } catch (err) {
      console.error(err);
      setResposta("Erro ao conectar com IA");
    }
  }

  async function login() {
    const email = prompt("Digite seu email:");
    if (!email) return;

    await supabase.auth.signInWithOtp({ email });
    alert("Verifique seu email!");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <button onClick={login}>Entrar</button>
      ) : (
        <>
          <p>{user.email}</p>
          <button onClick={logout}>Sair</button>

          <hr />

          <h3>Como você está se sentindo?</h3>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ width: "300px" }}
          />

          <br /><br />

          <button onClick={enviarTexto}>Falar com IA</button>

          <p><strong>Resposta:</strong> {resposta}</p>

          <hr />

          <h2>📊 Evolução</h2>
          <p>Score: {score.toFixed(2)}</p>
          <p>Nível: {nivel}</p>

          <h3>📜 Histórico</h3>
          <ul>
            {historico.map((item) => (
              <li key={item.id}>
                {item.estado} - {new Date(item.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
