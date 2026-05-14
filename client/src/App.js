import React, {
  useState,
  useEffect,
} from "react";

import AppInterno from "./AppInterno";

import { supabase } from "./supabaseClient";

/* ======================================================
   ADMIN FIXO
====================================================== */

const ADMIN_EMAIL =
  "contatobetaoofertas@gmail.com";

/* ======================================================
   APP
====================================================== */

export default function App() {

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

  const [loadingAuth,
    setLoadingAuth] =
    useState(false);

  /* ======================================================
     CRIAR / BUSCAR PROFILE
  ====================================================== */

  async function carregarProfile(user) {

    try {

      const isAdmin =
        user.email?.toLowerCase().trim() ===
        ADMIN_EMAIL.toLowerCase().trim();

      /* =========================================
         BUSCAR PROFILE
      ========================================= */

      const {
        data: profileExistente,
        error,
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (error) {

        console.log(
          "ERRO BUSCAR PROFILE:",
          error
        );

        return;
      }

      /* =========================================
         SE NÃO EXISTIR -> CRIAR
      ========================================= */

      if (!profileExistente) {

        const novoProfile = {

          id: user.id,

          email: user.email,

          nome:
            user.email,

          plano:
            isAdmin
              ? "premium"
              : "free",

          premium:
            isAdmin,

          admin:
            isAdmin,
        };

        const {
          error: erroInsert,
        } =
          await supabase
            .from("profiles")
            .insert(
              novoProfile
            );

        if (erroInsert) {

          console.log(
            "ERRO INSERT PROFILE:",
            erroInsert
          );
        }

        setUsuarioAtual(
          novoProfile
        );

        return;
      }

      /* =========================================
         ADMIN FIXO
      ========================================= */

      if (isAdmin) {

        const profileAdmin = {

          ...profileExistente,

          plano: "premium",

          premium: true,

          admin: true,
        };

        await supabase
          .from("profiles")
          .update({

            plano: "premium",

            premium: true,

            admin: true,
          })

          .eq(
            "id",
            user.id
          );

        setUsuarioAtual(
          profileAdmin
        );

        return;
      }

      /* =========================================
         USUÁRIO FREE
      ========================================= */

      const profileFree = {

        ...profileExistente,

        plano: "free",

        premium: false,

        admin: false,
      };

      await supabase
        .from("profiles")
        .update({

          plano: "free",

          premium: false,

          admin: false,
        })

        .eq(
          "id",
          user.id
        );

      setUsuarioAtual(
        profileFree
      );

    } catch (erro) {

      console.log(
        "ERRO PROFILE:",
        erro
      );
    }
  }

  /* ======================================================
     VERIFICAR SESSÃO
  ====================================================== */

  useEffect(() => {

    async function verificarSessao() {

      try {

        const {
          data: { session },
          error,
        } =
          await supabase.auth.getSession();

        if (error) {

          console.log(
            "ERRO GET SESSION:",
            error
          );

          setLogado(false);

          setUsuarioAtual(null);

          return;
        }

        if (session?.user) {

          await carregarProfile(
            session.user
          );

          setLogado(true);

        } else {

          setLogado(false);

          setUsuarioAtual(null);
        }

      } catch (erro) {

        console.log(
          "ERRO SESSÃO:",
          erro
        );

        setLogado(false);

        setUsuarioAtual(null);

      } finally {

        setCarregandoSessao(false);
      }
    }

    verificarSessao();

    const {
      data:
        listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {

          console.log(
            "AUTH EVENT:",
            event
          );

          if (
            session?.user
          ) {

            await carregarProfile(
              session.user
            );

            setLogado(true);

          } else {

            setUsuarioAtual(
              null
            );

            setLogado(false);
          }

          setCarregandoSessao(false);
        }
      );

    return () => {

      listener?.subscription.unsubscribe();
    };

  }, []);

  /* ======================================================
     LOGIN
  ====================================================== */

  async function entrar() {

    if (
      !email ||
      !senha
    ) {

      alert(
        "Preencha email e senha."
      );

      return;
    }

    try {

      setLoadingAuth(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({

          email:
            email.trim(),

          password:
            senha.trim(),
        });

      if (error) {

        alert(
          error.message
        );

        return;
      }

      if (
        data?.user
      ) {

        setEmail("");

        setSenha("");
      }

    } catch (erro) {

      console.log(
        "ERRO LOGIN:",
        erro
      );

      alert(
        "Erro ao realizar login."
      );

    } finally {

      setLoadingAuth(false);
    }
  }

  /* ======================================================
     CRIAR CONTA
  ====================================================== */

  async function criarConta() {

    if (
      !email ||
      !senha
    ) {

      alert(
        "Preencha email e senha."
      );

      return;
    }

    try {

      setLoadingAuth(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({

          email:
            email.trim(),

          password:
            senha.trim(),
        });

      if (error) {

        alert(
          error.message
        );

        return;
      }

      if (
        data?.user
      ) {

        alert(
          "Conta criada com sucesso!"
        );

        setEmail("");

        setSenha("");
      }

    } catch (erro) {

      console.log(
        "ERRO CADASTRO:",
        erro
      );

      alert(
        "Erro ao criar conta."
      );

    } finally {

      setLoadingAuth(false);
    }
  }

  /* ======================================================
     LOGOUT
  ====================================================== */

  async function sairSistema() {

    try {

      setCarregandoSessao(true);

      await supabase.auth.signOut();

      localStorage.clear();

      sessionStorage.clear();

      setUsuarioAtual(null);

      setLogado(false);

      window.location.href = "/";

    } catch (erro) {

      console.log(
        "ERRO LOGOUT:",
        erro
      );

    } finally {

      setCarregandoSessao(false);
    }
  }

  /* ======================================================
     LOADING
  ====================================================== */

  if (carregandoSessao) {

    return (

      <div style={styles.loading}>
        Carregando NeuroMapa360...
      </div>
    );
  }

  /* ======================================================
     DASHBOARD
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
     LOGIN SCREEN
  ====================================================== */

  return (

    <div style={styles.container}>

      <div style={styles.blur}></div>

      <div style={styles.card}>

        <div style={styles.logoContainer}>

          <div style={styles.logoCircle}></div>

          <h1 style={styles.logo}>
            NeuroMapa360
          </h1>

          <p style={styles.subtitle}>
            IA Terapêutica Neuro Sistêmica
          </p>

        </div>

        <div style={styles.form}>

          <input
            type="email"

            placeholder="Seu email"

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

            placeholder="Sua senha"

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

            disabled={loadingAuth}
          >
            {
              loadingAuth
                ? "Entrando..."
                : "Entrar"
            }
          </button>

          <button
            style={
              styles.secondaryButton
            }

            onClick={
              criarConta
            }

            disabled={loadingAuth}
          >
            {
              loadingAuth
                ? "Processando..."
                : "Criar Conta"
            }
          </button>

        </div>

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
      "linear-gradient(135deg,#020617,#0f172a,#111827)",

    overflow: "hidden",

    position: "relative",

    fontFamily:
      "Inter, Arial, sans-serif",
  },

  blur: {

    position: "absolute",

    width: 500,

    height: 500,

    borderRadius: "50%",

    background:
      "rgba(56,189,248,0.12)",

    filter: "blur(120px)",

    top: -100,

    right: -100,
  },

  loading: {

    height: "100vh",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    background:
      "#020617",

    color: "white",

    fontSize: 20,

    fontFamily:
      "Inter",
  },

  card: {

    width: 380,

    background:
      "rgba(15,23,42,0.88)",

    border:
      "1px solid rgba(255,255,255,0.06)",

    backdropFilter:
      "blur(18px)",

    borderRadius: 28,

    padding: 36,

    display: "flex",

    flexDirection: "column",

    gap: 28,

    zIndex: 2,

    boxShadow:
      "0 20px 60px rgba(0,0,0,0.45)",
  },

  logoContainer: {

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    gap: 12,
  },

  logoCircle: {

    width: 80,

    height: 80,

    borderRadius: "50%",

    background:
      "linear-gradient(135deg,#67e8f9,#38bdf8)",

    boxShadow:
      "0 0 40px rgba(56,189,248,0.45)",
  },

  logo: {

    color: "#ffffff",

    fontSize: 42,

    fontWeight: 800,

    margin: 0,
  },

  subtitle: {

    color: "#94a3b8",

    fontSize: 15,

    textAlign: "center",

    margin: 0,
  },

  form: {

    display: "flex",

    flexDirection: "column",

    gap: 16,
  },

  input: {

    height: 52,

    borderRadius: 14,

    border:
      "1px solid rgba(255,255,255,0.08)",

    background:
      "rgba(15,23,42,0.75)",

    color: "#ffffff",

    paddingLeft: 18,

    fontSize: 15,

    outline: "none",
  },

  button: {

    height: 52,

    borderRadius: 14,

    border: "none",

    background:
      "linear-gradient(135deg,#34d399,#10b981)",

    color: "#ffffff",

    fontWeight: 700,

    fontSize: 15,

    cursor: "pointer",

    transition: "0.2s",
  },

  secondaryButton: {

    height: 48,

    borderRadius: 14,

    border:
      "1px solid rgba(255,255,255,0.08)",

    background:
      "transparent",

    color: "#67e8f9",

    fontWeight: 600,

    cursor: "pointer",
  },
};