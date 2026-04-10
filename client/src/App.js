import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [loading, setLoading] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [contador, setContador] = useState(0);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user || null;

    console.log("SESSION:", sessionData);

    setUser(user);
  }

  async function handleLogin() {
    if (!email) return alert("Digite um email");

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert("Erro ao enviar email");
      console.error(error);
    } else {
      alert("Verifique seu email 📩");
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    setUser(null);
    setMensagens([]);
    setContador(0);
  }

  // 🔥 ADMIN / PREMIUM
  const ADMIN_EMAILS = [
    "contatobetaofertas@gmail.com",
    "ebony66@gmail.com",
  ];

  const isPremium = ADMIN_EMAILS.includes(
    (user?.email || "").toLowerCase().trim()
  );

  async function enviarTexto() {
    if (!texto.trim()) return;

    // 🔒 BLOQUEIO FREE
    if (!isPremium && contador >= 3) {
      alert("🔒 Você atingiu o limite gratuito. Torne-se Premium.");
      return;
    }

    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      console.log("SESSION DATA:", sessionData);
      console.log("USER ID:", currentUser?.id);

      // 🔥 PROTEÇÃO CRÍTICA
      if (!currentUser?.id) {
        alert("Erro de autenticação. Faça login novamente.");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: currentUser.id,
        }),
      });

      const json = await res.json();

      console.log("RESPOSTA BACKEND:", json);

      if (!res.ok) {
        alert("Erro no servidor");
        console.error(json);
        return;
      }

      // CHAT
      setMensagens((prev) => [
        ...prev,
        { tipo: "user", texto },
        { tipo: "ia", texto: json?.resposta || "Sem resposta" },
      ]);

      setTexto("");
      setContador((prev) => prev + 1);

    } catch (err) {
      console.error("ERRO AO ENVIAR:", err);
      alert("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }

  function irParaPagamento() {
    window.location.href =
      "https://buy.stripe.com/test_6oU7sKeRr9mzgU22wvfIs00";
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <>
          <input
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br /><br />
          <button onClick={handleLogin}>
            Entrar / Cadastrar
          </button>
        </>
      ) : (
        <>
          <p>👤 {user.email}</p>

          <button onClick={sair}>Sair</button>

          <p>
            🔒 Plano Free: {contador}/3 interações usadas
          </p>

          <br />

          <h3>Como você está se sentindo?</h3>

          <select
            value={emocao}
            onChange={(e) => setEmocao(e.target.value)}
          >
            <option>Ansioso</option>
            <option>Triste</option>
            <option>Desmotivado</option>
            <option>Cansado</option>
            <option>Feliz</option>
            <option>Confuso</option>
          </select>

          <br /><br />

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva como você está..."
            style={{ width: "300px", padding: "8px" }}
          />

          <br /><br />

          <button onClick={enviarTexto} disabled={loading}>
            {loading ? "Processando..." : "Falar com IA"}
          </button>

          <br /><br />

          {!isPremium && (
            <button onClick={irParaPagamento}>
              💎 Tornar Premium
            </button>
          )}

          {isPremium && (
            <p style={{ color: "green" }}>
              🌟 Você é Premium
            </p>
          )}

          <br />

          <h3>Conversa:</h3>

          <div style={{ maxWidth: "500px" }}>
            {mensagens.map((msg, index) => (
              <p key={index}>
                <strong>
                  {msg.tipo === "user" ? "Você:" : "IA:"}
                </strong>{" "}
                {msg.texto}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
