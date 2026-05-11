import React, { useState } from "react";

import AppInterno from "./AppInterno";

export default function App() {

  const [logado, setLogado] = useState(false);

  const [usuario, setUsuario] = useState(null);

  const [email, setEmail] = useState("");

  const [senha, setSenha] = useState("");

  /* ======================================================
     USUÁRIOS AUTORIZADOS
  ====================================================== */

  const usuarios = [

    {
      email: "contatobetaoofertas@gmail.com",
      senha: "123456",
      plano: "premium",
      isAdmin: true,
    },

    {
      email: "ebony66@gmail.com",
      senha: "123456",
      plano: "free",
      isAdmin: false,
    },

    {
      email: "segredodavida88@gmail.com",
      senha: "123456",
      plano: "free",
      isAdmin: false,
    },
  ];

  /* ======================================================
     LOGIN
  ====================================================== */

  function entrar() {

    if (!email || !senha) {

      alert("Preencha email e senha.");

      return;
    }

    const usuarioEncontrado =
      usuarios.find(
        (u) =>
          u.email === email &&
          u.senha === senha
      );

    if (!usuarioEncontrado) {

      alert("Email ou senha inválidos.");

      return;
    }

    setUsuario(usuarioEncontrado);

    setLogado(true);
  }

  /* ======================================================
     LOGOUT
  ====================================================== */

  function sair() {

    setLogado(false);

    setUsuario(null);

    setEmail("");

    setSenha("");
  }

  /* ======================================================
     APP INTERNO
  ====================================================== */

  if (logado) {

    return (

      <AppInterno
        usuario={usuario}
        sair={sair}
      />

    );
  }

  /* ======================================================
     LOGIN SCREEN
  ====================================================== */

  return (

    <div style={styles.container}>

      <div style={styles.card}>

        <h1 style={styles.logo}>
          NeuroMapa360
        </h1>

        <p style={styles.subtitle}>
          IA Terapêutica Neuro Sistêmica
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={entrar}
        >
          Entrar
        </button>

        <button
          style={styles.secondaryButton}
        >
          Criar Conta
        </button>

      </div>

    </div>
  );
}

/* ======================================================
   STYLES
====================================================== */

const styles = {

  container: {

    height: "100vh",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    background:
      "linear-gradient(135deg,#020617,#0f172a)",

    fontFamily:
      "Arial, sans-serif",
  },

  card: {

    width: 400,

    background: "#111827",

    borderRadius: 24,

    padding: 40,

    display: "flex",

    flexDirection: "column",

    gap: 20,

    boxShadow:
      "0 0 40px rgba(0,0,0,0.5)",
  },

  logo: {

    color: "#ffffff",

    textAlign: "center",

    fontSize: 34,

    marginBottom: 0,
  },

  subtitle: {

    textAlign: "center",

    color: "#94a3b8",

    marginTop: -10,

    marginBottom: 20,
  },

  input: {

    padding: 16,

    borderRadius: 12,

    border: "1px solid #1e293b",

    background: "#0f172a",

    color: "#ffffff",

    fontSize: 16,

    outline: "none",
  },

  button: {

    padding: 16,

    borderRadius: 12,

    border: "none",

    background: "#22c55e",

    color: "#ffffff",

    fontWeight: "bold",

    fontSize: 16,

    cursor: "pointer",

    transition: "0.3s",
  },

  secondaryButton: {

    padding: 14,

    borderRadius: 12,

    border:
      "1px solid #334155",

    background: "transparent",

    color: "#38bdf8",

    fontWeight: "bold",

    cursor: "pointer",
  },
};