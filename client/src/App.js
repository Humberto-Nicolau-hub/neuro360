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

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarUsuario();
  }, []);

  // 🔥 CRIA OU BUSCA PERFIL
  async function criarOuBuscarPerfil(user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) {
      await supabase.from("profiles").insert([
        {
          id: user.id,
          email: user.email,
          plano: "free",
          interacoes: 0,
        },
      ]);
    }
  }

  // 🔥 CARREGA PERFIL
  async function carregarPerfil(user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setPerfil(data);
  }

  // 🔥 CARREGA USUÁRIO
  async function carregarUsuario() {
    const { data } = await supabase.auth.getUser();
    const usuario = data?.user || null;

    setUser(usuario);

    if (usuario) {
      await criarOuBuscarPerfil(usuario);
      await carregarPerfil(usuario);
    }

    setCarregando(false);
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
    setPerfil(null);
    setMensagens([]);
  }

  // 🔥 AGORA O PREMIUM VEM DO BANCO
  const isPremium = perfil?.plano === "premium";

  console.log("EMAIL:", user?.email);
  console.log("PERFIL:", perfil);

  async function enviarTexto() {
    if (!texto.trim()) return;

    // 🔒 BLOQUEIO FREE REAL
    if (!isPremium && perfil?.interacoes >= 3) {
      alert("🚀 Você iniciou um processo importante.\n\nPara continuar sua evolução emocional sem interrupções, ative o Premium.");
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
        body: JSON.stringify({
          texto,
          emocao,
        }),
      });

      const json = await res.json();

      setMensagens((prev) => [
        ...prev,
        { tipo: "user", texto },
        { tipo: "ia", texto: json?.resposta || "Sem resposta" },
      ]);

      setTexto("");

      // 🔥 ATUALIZA BANCO
      if (!isPremium && perfil) {
        const novaQtd = perfil.interacoes + 1;

        await supabase
          .from("profiles")
          .update({ interacoes: novaQtd })
          .eq("id", user.id);

        setPerfil({
          ...perfil,
          interacoes: novaQtd,
        });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function irParaPagamento() {
    window.location.href = "https://buy.stripe.com/test_6oU7sKeRr9mzgU22wvfIs00";
  }

  // 🔥 BLOQUEIA ATÉ CARREGAR
  if (carregando) {
    return <p>Carregando...</p>;
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

          <br /><br />

          {!isPremium && (
            <p style={{ color: "orange" }}>
              🔒 Plano Free: {perfil?.interacoes || 0}/3 interações usadas
            </p>
          )}

          {isPremium && (
            <p style={{ color: "green" }}>
              🌟 Você é Premium (ilimitado)
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
              🚀 Desbloquear evolução emocional
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
