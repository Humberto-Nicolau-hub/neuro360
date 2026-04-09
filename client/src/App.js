import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

// 👑 EMAILS ADMIN (SEMPRE PREMIUM)
const ADMIN_EMAILS = [
  "contatobetaofertas@gmail.com",
  "ebony66@gmail.com",
];

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
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function handleLogin() {
    if (!email) {
      alert("Digite um email");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
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

  // 💎 VERIFICA SE É PREMIUM
  const isPremium = ADMIN_EMAILS.includes(
    (user?.email || "").toLowerCase().trim()
  );

  // 🚀 ENVIO + IA + BANCO
  async function enviarTexto() {
    if (!texto.trim()) return;

    // 🔒 BLOQUEIO FREE
    if (!isPremium && contador >= 3) {
      alert(
        "🚀 Você iniciou sua transformação.\n\nPara continuar evoluindo sem limites, desbloqueie o Premium."
      );
      return;
    }

    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session?.user) {
        alert("Usuário não autenticado");
        return;
      }

      const userId = session.user.id;
      console.log("USER ID:", userId);

      // 🤖 CHAMA IA
      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          texto,
          emocao,
        }),
      });

      const json = await res.json();

      // 💾 SALVA NO BANCO
      const { error } = await supabase.from("registros").insert([
        {
          user_id: userId,
          emocao: emocao,
          texto: texto,
          resposta: json?.resposta || "",
        },
      ]);

      if (error) {
        console.error("ERRO AO SALVAR:", error);
      }

      // 💬 ATUALIZA CHAT
      setMensagens((prev) => [
        ...prev,
        { tipo: "user", texto },
        { tipo: "ia", texto: json?.resposta || "Sem resposta" },
      ]);

      setTexto("");
      setContador((prev) => prev + 1);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function irParaPagamento() {
    window.location.href =
      "https://buy.stripe.com/test_6oU7sKeRr9mzgU22wvfIs00";
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
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

          <br /><br />

          {!isPremium && (
            <p style={{ color: "orange" }}>
              🔒 Plano Free: {contador}/3 interações usadas
            </p>
          )}

          {isPremium && (
            <p style={{ color: "green" }}>
              🌟 Você é Premium
            </p>
          )}

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
              💎 Desbloquear evolução emocional
            </button>
          )}

          <br /><br />

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
