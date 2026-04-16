import React, { useState } from "react";

function App() {
  const [logado, setLogado] = useState(false);
  const [email, setEmail] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");

  const [progresso, setProgresso] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  const [completadoHoje, setCompletadoHoje] = useState(false);

  const handleLogin = () => {
    if (email.trim() !== "") {
      setLogado(true);
    }
  };

  const falarComIA = () => {
    let respostaGerada = `
Sentir-se ${emocao.toLowerCase()} é algo comum.

1. Respire profundamente
2. Observe seus pensamentos
3. Escreva o que está sentindo
4. Divida seus problemas em partes menores
5. Pratique atenção no presente
`;

    setResposta(respostaGerada);
  };

  const completarHoje = () => {
    if (!completadoHoje) {
      setProgresso(progresso + 1);
      setSequencia(sequencia + 1);
      setCompletadoHoje(true);
    }
  };

  // 🔐 TELA LOGIN
  if (!logado) {
    return (
      <div style={styles.container}>
        <h1>NeuroMapa360</h1>

        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
          Entrar
        </button>
      </div>
    );
  }

  // 🚀 TELA PRINCIPAL
  return (
    <div style={styles.container}>
      <h1>NeuroMapa360</h1>

      <div style={styles.badge}>⭐ Premium Ativo</div>

      <h2>Como você está se sentindo?</h2>

      <select
        value={emocao}
        onChange={(e) => setEmocao(e.target.value)}
        style={styles.input}
      >
        <option>Ansioso</option>
        <option>Procrastinando</option>
        <option>Triste</option>
        <option>Desmotivado</option>
      </select>

      <textarea
        placeholder="Descreva como está se sentindo..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        style={styles.textarea}
      />

      <button onClick={falarComIA} style={styles.button}>
        Falar com IA
      </button>

      {/* META */}
      <div style={styles.card}>
        <h3>🎯 Meta</h3>
        <p>Observar emoções por 3 dias</p>

        <p>📊 Progresso: {progresso}/3</p>

        <button onClick={completarHoje} style={styles.smallButton}>
          ✅ Completei hoje
        </button>

        <p>🔥 Sequência: {sequencia} dias</p>
      </div>

      {/* TRILHA */}
      <div style={styles.card}>
        <h3>🚀 Trilha</h3>
        <p>Autoconhecimento</p>
      </div>

      {/* RESPOSTA */}
      {resposta && (
        <div style={styles.card}>
          <h3>🤖 Resposta da IA</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{resposta}</pre>
        </div>
      )}
    </div>
  );
}

// 🎨 ESTILO
const styles = {
  container: {
    maxWidth: 500,
    margin: "50px auto",
    textAlign: "center",
    fontFamily: "Arial",
  },
  input: {
    width: "100%",
    padding: 10,
    margin: "10px 0",
  },
  textarea: {
    width: "100%",
    padding: 10,
    height: 100,
    margin: "10px 0",
  },
  button: {
    width: "100%",
    padding: 12,
    backgroundColor: "green",
    color: "white",
    border: "none",
    marginTop: 10,
    cursor: "pointer",
  },
  smallButton: {
    padding: 8,
    marginTop: 10,
    cursor: "pointer",
  },
  badge: {
    backgroundColor: "orange",
    color: "white",
    padding: "5px 10px",
    display: "inline-block",
    marginBottom: 20,
  },
  card: {
    border: "1px solid #ccc",
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
  },
};

export default App;
