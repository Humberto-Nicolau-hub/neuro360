import React, {
  useState,
  useEffect,
} from "react";

import AppInterno from "./AppInterno";

export default function App() {

  /* ======================================================
     STATES
  ====================================================== */

  const [logado, setLogado] =
    useState(false);

  const [usuarioAtual,
    setUsuarioAtual] =
    useState(null);

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [carregandoSessao,
    setCarregandoSessao] =
    useState(true);

  /* ======================================================
     USUÁRIOS
  ====================================================== */

  const usuarios = [

    {
      email:
        "contatobetaoofertas@gmail.com",

      senha: "123456",

      admin: true,

      premium: true,

      plano: "premium",
    },

    {
      email:
        "ebony66@gmail.com",

      senha: "123456",

      admin: false,

      premium: false,

      plano: "free",
    },

    {
      email:
        "segredodavida88@gmail.com",

      senha: "123456",

      admin: false,

      premium: false,

      plano: "free",
    },

    {
      email:
        "segurosbrokerdf@gmail.com",

      senha: "123456",

      admin: false,

      premium: false,

      plano: "free",
    },
  ];

  /* ======================================================
     VERIFICA SESSÃO
  ====================================================== */

  useEffect(() => {

    try {

      const usuarioSalvo =
        localStorage.getItem(
          "usuario"
        );

      if (!usuarioSalvo) {

        setCarregandoSessao(false);

        return;
      }

      const usuarioParseado =
        JSON.parse(usuarioSalvo);

      const usuarioValido =
        usuarios.find(
          (u) =>
            u.email ===
            usuarioParseado.email
        );

      if (!usuarioValido) {

        localStorage.removeItem(
          "usuario"
        );

        setUsuarioAtual(null);

        setLogado(false);

        setCarregandoSessao(false);

        return;
      }

      const sessaoLimpa = {

        email:
          usuarioValido.email,

        admin:
          usuarioValido.admin,

        premium:
          usuarioValido.premium,

        plano:
          usuarioValido.plano,
      };

      setUsuarioAtual(
        sessaoLimpa
      );

      setLogado(true);

    } catch (erro) {

      console.log(erro);

      localStorage.removeItem(
        "usuario"
      );

      setUsuarioAtual(null);

      setLogado(false);

    } finally {

      setCarregandoSessao(false);
    }

  }, []);

  /* ======================================================
     LOGIN
  ====================================================== */

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

    /* =========================================
       LIMPA SESSÃO ANTERIOR
    ========================================= */

    setUsuarioAtual(null);

    setLogado(false);

    localStorage.removeItem(
      "usuario"
    );

    sessionStorage.clear();

    /* =========================================
       PROCURA USUÁRIO
    ========================================= */

    const usuarioEncontrado =
      usuarios.find(
        (usuario) =>

          usuario.email ===
            emailLimpo &&

          usuario.senha ===
            senhaLimpa
      );

    if (!usuarioEncontrado) {

      alert(
        "Email ou senha inválidos."
      );

      return;
    }

    /* =========================================
       NOVA SESSÃO SEGURA
    ========================================= */

    const novaSessao = {

      email:
        usuarioEncontrado.email,

      admin:
        usuarioEncontrado.admin,

      premium:
        usuarioEncontrado.premium,

      plano:
        usuarioEncontrado.plano,

      loginAtivo: true,

      ultimoLogin:
        new Date().toISOString(),
    };

    localStorage.setItem(
      "usuario",
      JSON.stringify(
        novaSessao
      )
    );

    /* =========================================
       ATUALIZA ESTADO
    ========================================= */

    setUsuarioAtual(
      novaSessao
    );

    setLogado(true);

    /* =========================================
       LIMPA INPUTS
    ========================================= */

    setEmail("");

    setSenha("");
  }

  /* ======================================================
     LOGOUT
  ====================================================== */

  function sairSistema() {

    localStorage.removeItem(
      "usuario"
    );

    sessionStorage.clear();

    setUsuarioAtual(null);

    setLogado(false);

    window.location.reload();
  }

  /* ======================================================
     CARREGANDO
  ====================================================== */

  if (carregandoSessao) {

    return (

      <div
        style={{

          height: "100vh",

          display: "flex",

          justifyContent:
            "center",

          alignItems:
            "center",

          background:
            "#020617",

          color: "white",

          fontSize: "22px",

          fontFamily:
            "Arial",
        }}
      >
        Carregando NeuroMapa360...
      </div>
    );
  }

  /* ======================================================
     APP INTERNO
  ====================================================== */

  if (
    logado &&
    usuarioAtual
  ) {

    return (

      <AppInterno
        usuario={
          usuarioAtual
        }

        onLogout={
          sairSistema
        }
      />
    );
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
          style={
            styles.secondaryButton
          }
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

    border:
      "1px solid #1e293b",

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