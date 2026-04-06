import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔐 SUPABASE
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

// 🎯 SCORE
function calcularScore(emocao) {
  switch (emocao) {
    case "ansioso": return -2;
    case "desmotivado": return -1;
    case "triste": return -2;
    case "confuso": return -1;
    case "bem": return +2;
    default: return 0;
  }
}

// 🧠 NÍVEL
function calcularNivel(score) {
  if (score < 10) return "Instável";
  if (score < 30) return "Em evolução";
  if (score < 60) return "Consistente";
  return "Alta performance";
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [emocao, setEmocao] = useState("ansioso");
  const [mensagem, setMensagem] = useState("");
  const [resposta, setResposta] = useState("");
  const [trilha, setTrilha] = useState([]);

  const [score, setScore] = useState(0);

  // LOGIN
  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) return alert(error.message);

    setUsuario(data.user);
  };

  // LOGOUT
  const sair = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  // SALVAR
  const salvar = async () => {
    const novoScore = score + calcularScore(emocao);
    setScore(novoScore);

    await supabase.from("feedbacks").insert([
      {
        usuario: usuario.email,
        emocao,
        estado: mensagem,
        score: novoScore
      }
    ]);

    alert("Salvo com sucesso 🚀");
  };

  // IA + TRILHA
  const falarComIA = async () => {
    try {
      const res = await fetch("https://neuro360-tkyx.onrender.com/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem,
          emocao,
          email: usuario.email
        })
      });

      const data = await res.json();

      setResposta(data.resposta);
      setTrilha(data.trilha || []);

    } catch (err) {
      console.error(err);
      alert("Erro ao falar com IA");
    }
  };

  // LOGIN UI
  if (!usuario) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <h1>NeuroMapa360</h1>

        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <br /><br />

        <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />
        <br /><br />

        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>

      <h1>🚀 NeuroMapa360</h1>

      <p>{usuario.email}</p>
      <button onClick={sair}>Sair</button>

      <hr />

      <h2>Como você está se sentindo?</h2>

      {/* EMOÇÃO */}
      <select value={emocao} onChange={(e) => setEmocao(e.target.value)}>
        <option value="ansioso">Ansioso</option>
        <option value="desmotivado">Desmotivado</option>
        <option value="triste">Triste</option>
        <option value="confuso">Confuso</option>
        <option value="bem">Bem</option>
      </select>

      <br /><br />

      {/* TEXTO */}
      <textarea
        placeholder="Descreva seu estado..."
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        style={{ width: 300, height: 80 }}
      />

      <br /><br />

      {/* BOTÕES */}
      <button onClick={salvar}>Salvar</button>
      <button onClick={falarComIA}>Falar com IA</button>

      <hr />

      {/* EVOLUÇÃO */}
      <h2>📊 Evolução</h2>
      <p>Score: {score}</p>
      <p>Nível: {calcularNivel(score)}</p>

      <hr />

      {/* IA */}
      <h2>🤖 Resposta da IA</h2>
      <p>{resposta}</p>

      <hr />

      {/* TRILHA */}
      <h2>🧠 Sua trilha de evolução</h2>
      {trilha.length > 0 ? (
        trilha.map((passo, i) => (
          <p key={i}>👉 {passo}</p>
        ))
      ) : (
        <p>Nenhuma trilha ainda</p>
      )}

    </div>
  );
}

export default App;
