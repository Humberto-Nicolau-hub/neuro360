import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [loading, setLoading] = useState(false);
  const [mensagens, setMensagens] = useState([]);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data } = await supabase.auth.getUser();
    const usuario = data?.user || null;
    setUser(usuario);

    if (usuario) {
      buscarPerfil(usuario.id);
    }
  }

  async function buscarPerfil(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setPerfil(data);
  }

  async function handleLogin() {
    if (!email) return alert("Digite um email");

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) alert("Erro ao enviar email");
    else alert("Verifique seu email 📩");
  }

  async function sair() {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setMensagens([]);
  }

  const isPremium = perfil?.plano === "premium";

  async function enviarTexto() {
    if (!texto.trim()) return;

    if (!isPremium && perfil?.interacoes >= 3) {
      alert(
        "Você iniciou um processo poderoso.\n\nPara continuar sua evolução mental sem limites, desbloqueie o Premium."
      );
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
        body: JSON.stringify({ texto, emocao }),
      });

      const json = await res.json();

      setMensagens((prev) => [
        ...prev,
        { tipo: "user", texto },
        { tipo: "ia", texto: json?.resposta || "Sem resposta" },
      ]);

      setTexto("");

      // 🔥 Atualiza interações
      if (!isPremium) {
        await supabase
          .from("profiles")
          .update({ interacoes: (perfil?.interacoes || 0) + 1 })
          .eq("id", user.id);

        buscarPerfil(user.id);
      }
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
    <div style={styles.container}>
      <h1 style={styles.title}>🧠 NeuroMapa360</h1>

      {!user ? (
        <div style={styles.card}>
          <input
            style={styles.input}
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>
            Entrar / Iniciar jornada
          </button>
        </div>
      ) : (
        <>
          <p style={{ color: "#aaa" }}>👤 {user.email}</p>
          <button style={styles.logout} onClick={sair}>
            Sair
          </button>

          <p style={{ marginTop: 10 }}>
            {isPremium
              ? "🌟 Modo evolução contínua ativado"
              : `🔒 Plano Free: ${perfil?.interacoes || 0}/3 sessões usadas`}
          </p>

          <h3>Como sua mente está agora?</h3>

          <div style={styles.emocoes}>
            {["Ansioso", "Triste", "Confuso", "Cansado", "Feliz"].map((e) => (
              <button
                key={e}
                style={{
                  ...styles.emocaoBtn,
                  background: emocao === e ? "#6c5ce7" : "#222",
                }}
                onClick={() => setEmocao(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            style={styles.input}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva o que está passando pela sua mente..."
          />

          <button style={styles.button} onClick={enviarTexto}>
            {loading ? "Processando..." : "Iniciar exploração mental"}
          </button>

          {!isPremium && (
            <button style={styles.premium} onClick={irParaPagamento}>
              💎 Desbloquear evolução completa
            </button>
          )}

          <div style={styles.chat}>
            {mensagens.map((msg, i) => (
              <div
                key={i}
                style={
                  msg.tipo === "user"
                    ? styles.userMsg
                    : styles.iaMsg
                }
              >
                <strong>
                  {msg.tipo === "user" ? "Você:" : "IA:"}
                </strong>{" "}
                {msg.texto}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "#0f0f1a",
    color: "#fff",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#a29bfe",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 300,
    margin: "auto",
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "none",
  },
  button: {
    padding: 12,
    borderRadius: 10,
    background: "#6c5ce7",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  logout: {
    marginTop: 10,
    background: "#333",
    color: "#fff",
    padding: 6,
  },
  emocoes: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  emocaoBtn: {
    padding: 8,
    borderRadius: 8,
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  premium: {
    marginTop: 10,
    background: "#00cec9",
    padding: 10,
    borderRadius: 10,
    border: "none",
  },
  chat: {
    marginTop: 20,
  },
  userMsg: {
    background: "#2d3436",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  iaMsg: {
    background: "#6c5ce7",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
};

export default App;
