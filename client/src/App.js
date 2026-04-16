import React, { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [logged, setLogged] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [plano, setPlano] = useState("free");

  const login = () => {
    if (email) setLogged(true);
  };

  const falarIA = async () => {
    const res = await fetch("/api/ia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mensagem, emocao }),
    });

    const data = await res.json();
    setResposta(data.resposta);
  };

  if (!logged) {
    return (
      <div style={{ padding: 40 }}>
        <h1>NeuroMapa360</h1>
        <input
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <br />
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>NeuroMapa360</h1>

      <p>Plano atual: {plano}</p>

      <button onClick={() => setPlano("premium")}>
        Ativar Premium
      </button>

      <hr />

      <select
        value={emocao}
        onChange={(e) => setEmocao(e.target.value)}
      >
        <option>Ansioso</option>
        <option>Triste</option>
        <option>Confuso</option>
      </select>

      <br />
      <br />

      <input
        placeholder="Digite como você se sente"
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
      />

      <br />
      <br />

      <button onClick={falarIA}>Falar com IA</button>

      <hr />

      <h3>Resposta da IA</h3>
      <p>{resposta}</p>

      {plano === "premium" && (
        <>
          <hr />
          <button>Gerar Relatório</button>
        </>
      )}
    </div>
  );
}

export default App;
