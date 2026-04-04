import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔥 CONFIG SUPABASE
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

function App() {
  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ LOGIN
  const fazerLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) {
        alert("Erro no login: " + error.message);
        return;
      }

      setUsuario(data.user);
      alert("Login realizado com sucesso 🚀");

    } catch (err) {
      console.error(err);
      alert("Erro inesperado no login");
    }
  };

  // ✅ LOGOUT
  const sair = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  // 🔥 CHAMAR IA (CORRIGIDO)
  const falarComIA = async () => {
    if (!mensagem) {
      alert("Digite algo primeiro");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem,
          email: usuario?.email || "anonimo"
        })
      });

      const data = await res.json();

      console.log("RESPOSTA BACKEND:", data);

      if (!res.ok) {
        throw new Error(data.error || "Erro no servidor");
      }

      setResposta(data.resposta || "Sem resposta da IA");

    } catch (err) {
      console.error("ERRO IA:", err);
      setResposta("Erro ao falar com IA (veja console)");
      alert("Erro ao falar com IA");
    }

    setLoading(false);
  };

  // 🔐 LOGIN
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

  // 🚀 APP
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
        style={{ width: "300px", height: "80px" }}
      />

      <br /><br />

      <button onClick={falarComIA} disabled={loading}>
        {loading ? "Pensando..." : "Falar com IA"}
      </button>

      <hr />

      <h2>🤖 Resposta da IA</h2>
      <p>{resposta}</p>
    </div>
  );
}

export default App;
