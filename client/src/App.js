import React, { useState } from "react";

import AppInterno from "./AppInterno";

export default function App() {

  const [logado, setLogado] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const ADMIN_EMAIL =
    "contatobetaoofertas@gmail.com";

  const ADMIN_SENHA =
    "123456";

  function entrar() {

    const emailLimpo =
      email
        .trim()
        .toLowerCase();

    const senhaLimpa =
      senha.trim();

    if (
      !emailLimpo ||
      !senhaLimpa
    ) {

      alert(
        "Preencha email e senha."
      );

      return;
    }

    if (
      emailLimpo !== ADMIN_EMAIL ||
      senhaLimpa !== ADMIN_SENHA
    ) {

      alert(
        "Email ou senha inválidos."
      );

      return;
    }

    localStorage.setItem(
      "usuario",
      JSON.stringify({
        email: emailLimpo,
        premium: true,
        admin: true,
      })
    );

    setLogado(true);
  }

  /* ======================================================
     APP INTERNO
  ====================================================== */

  if (logado) {

    return <AppInterno />;
  }

  /* ======================================================
     LOGIN
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
            setEmail(
              e.target.value
            )
          }
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(
              e.target.value
            )
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