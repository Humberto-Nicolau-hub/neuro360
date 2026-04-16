import React, { useState, useEffect } from "react";

export default function App() {
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("");
  const [resposta, setResposta] = useState("");
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  const API_URL = "https://neuro360-tkyx.onrender.com";

  // 🔹 LOGIN SIMPLES
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(false);

  const login = () => {
    if (email) {
      setSession(true);
    }
  };

  // 🔹 CHAMAR IA (CORRIGIDO)
  const falarComIA = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto,
          emocao,
          user_id: email,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro na IA");
      }

      setResposta(result.resposta);
    } catch (err) {
      console.error(err);
      alert("Erro ao chamar IA");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 DASHBOARD (CORRIGIDO)
  const carregarDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard?user_id=${email}`);
      const result = await res.json();

      setDados(result.dados || []);
    } catch (err) {
      console.error("Erro dashboard:", err);
    }
  };

  // 🔹 VERIFICAR BLOQUEIO
  const verificarBloqueio = async () => {
    try {
      const res = await fetch(`${API_URL}/verificar?user_id=${email}`);
      const result = await res.json();

      if (result.bloqueado) {
        setBloqueado(true);
      } else {
        setBloqueado(false);
        await carregarDashboard();
      }
    } catch (err) {
      console.error("Erro verificação:", err);
    }
  };

  useEffect(() => {
    if (session) {
      verificarBloqueio();
    }
  }, [session]);

  // 🔹 TELA LOGIN
  if (!session) {
    return (
      <div style={styles.container}>
        <h2>NeuroMapa360</h2>
        <input
          placeholder="Seu email"
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <button onClick={login} style={styles.button}>
          Entrar
        </button>
      </div>
    );
  }

  // 🔹 APP PRINCIPAL
  return (
    <div style={styles.container}>
      <h2>NeuroMapa360</h2>

      {/* BLOQUEIO */}
      {bloqueado && (
        <p style={{ color: "red" }}>
          🔒 Limite FREE atingido. Faça upgrade.
        </p>
      )}

      {/* FORM */}
      <select
        onChange={(e) => setEmocao(e.target.value)}
        style={styles.input}
      >
        <option value="">Selecione emoção</option>
        <option>Ansioso</option>
        <option>Triste</option>
        <option>Confuso</option>
        <option>Motivado</option>
      </select>

      <input
        placeholder="Digite seu pensamento"
        onChange={(e) => setTexto(e.target.value)}
        style={styles.input}
      />

      <button
        onClick={falarComIA}
        style={styles.button}
        disabled={loading || bloqueado}
      >
        {loading ? "Processando..." : "Falar com IA"}
      </button>

      {/* RESPOSTA */}
      {resposta && (
        <div style={styles.box}>
          <h4>Resposta da IA</h4>
          <p>{resposta}</p>
        </div>
      )}

      {/* DASHBOARD */}
      {dados.length > 0 && (
        <div style={styles.box}>
          <h4>Evolução emocional</h4>
          {dados.map((d, i) => (
            <p key={i}>
              {d.emocao} - {d.score}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// 🔹 ESTILO
const styles = {
  container: {
    maxWidth: 400,
    margin: "auto",
    padding: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    margin: "10px 0",
  },
  button: {
    padding: 10,
    width: "100%",
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  box: {
    marginTop: 20,
    padding: 15,
    border: "1px solid #ddd",
  },
};
