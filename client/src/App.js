import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔥 CONFIG SUPABASE (ANON KEY)
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "SUA_ANON_KEY_AQUI"
);

function App() {
  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [resposta, setResposta] = useState("");

  // ✅ LOGIN CORRIGIDO
  const fazerLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) {
        console.error("Erro login:", error.message);
        alert("Erro no login: " + error.message);
        return;
      }

      if (data?.user) {
        setUsuario(data.user);
        alert("Login realizado com sucesso 🚀");
      } else {
        alert("Usuário não encontrado");
      }

    } catch (err) {
      console.error("Erro geral:", err);
      alert("Erro inesperado no login");
    }
  };

  // ✅ LOGOUT
  const sair = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  // ✅ CHAMAR IA
  const falarComIA = async () => {
    try {
      const res = await fetch("https://SEU-BACKEND.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem,
          email: usuario.email
        })
      });

      const data = await res.json();
      setResposta(data.resposta);

    } catch (err) {
      console.error(err);
      alert("Erro ao falar com IA");
    }
  };

  // 🔐 TELA LOGIN
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>NeuroMapa360</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <br /><br />

        <button onClick={fazerLogin}>Entrar</button>
      </div>
    );
  }

  // 🔥 APP PRINCIPAL
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚀 NeuroMapa360</h1>

      <p>{usuario.email}</p>
      <button onClick={sair}>Sair</button>

      <hr />

      <h2>Como você está se sentindo?</h2>

      <textarea
        placeholder="Descreva seu estado..."
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
      />

      <br /><br />

      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      <h2>🤖 Resposta da IA</h2>
      <p>{resposta}</p>
    </div>
  );
}

export default App;
