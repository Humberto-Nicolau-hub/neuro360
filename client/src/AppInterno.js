import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import AdminDashboard from "./AdminDashboard";

export default function AppInterno({
  usuario,
  onLogout,
}) {

  /* ======================================================
     PROTEÇÃO ANTI LOOP
  ====================================================== */

  if (!usuario) {

    return (
      <div
        style={{
          height: "100vh",
          background: "#020617",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 22,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Carregando NeuroMapa360...
      </div>
    );
  }

  const [mensagem, setMensagem] =
    useState("");

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [mostrarAdmin, setMostrarAdmin] =
    useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const finalChatRef =
    useRef(null);

  /* ======================================================
     AUTO SCROLL
  ====================================================== */

  useEffect(() => {

    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [historico]);

  /* ======================================================
     ADMIN
  ====================================================== */

  const isAdmin =
    usuario?.admin === true;

  const plano =
    isAdmin
      ? "ADMIN PREMIUM"
      : (
          usuario?.plano || "free"
        ).toUpperCase();

  /* ======================================================
     ESTADO EMOCIONAL
  ====================================================== */

  const estadoEmocional = {

    score: 82,

    hawkins: 540,

    consciencia:
      "Expansão",

    trilha:
      "Reequilíbrio",

    emocao:
      "Equilibrado",
  };

  /* ======================================================
     LOGOUT ESTÁVEL
  ====================================================== */

  async function sair() {

    if (saindo) return;

    try {

      setSaindo(true);

      localStorage.clear();

      sessionStorage.clear();

      if (onLogout) {

        await onLogout();
      }

      setTimeout(() => {

        window.location.reload();

      }, 500);

    } catch (erro) {

      console.log(
        "ERRO LOGOUT:",
        erro
      );

      setSaindo(false);
    }
  }

  /* ======================================================
     CHAT IA
  ====================================================== */

  async function enviarMensagem() {

    if (!mensagem.trim()) return;

    const textoUsuario =
      mensagem;

    setHistorico((prev) => [
      ...prev,
      {
        tipo: "usuario",
        texto: textoUsuario,
      },
    ]);

    setMensagem("");

    setLoading(true);

    try {

      const response =
        await fetch(
          "https://neuro360-api.onrender.com/api/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              mensagem:
                textoUsuario,

              perfil:
                plano,

              premium:
                isAdmin ||
                usuario?.premium,

              user_id:
                usuario?.id ||
                usuario?.email ||
                "anonimo",

              email:
                usuario?.email,
            }),
          }
        );

      const data =
        await response.json();

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:

            data?.resposta ||

            "Não consegui responder agora.",
        },
      ]);

    } catch (erro) {

      console.log(
        "ERRO IA:",
        erro
      );

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            "IA temporariamente indisponível.",
        },
      ]);

    } finally {

      setLoading(false);
    }
  }

  /* ======================================================
     DASHBOARD ADMIN
  ====================================================== */

  if (
    mostrarAdmin &&
    isAdmin
  ) {

    return (

      <AdminDashboard
        user={usuario}
        onVoltar={() =>
          setMostrarAdmin(false)
        }
      />
    );
  }

  return (

    <div style={styles.container}>

      <aside style={styles.sidebar}>

        <h1 style={styles.logo}>
          NeuroMapa360
        </h1>

        <p style={styles.sub}>
          IA Terapêutica Ativa
        </p>

        <div style={styles.infoCard}>

          <div>
            👤 {usuario?.email}
          </div>

          <div>
            🧠 Emoção:
            {" "}
            {estadoEmocional.emocao}
          </div>

          <div>
            📊 Score:
            {" "}
            {estadoEmocional.score}
          </div>

        </div>

        {
          isAdmin && (

            <button
              onClick={() =>
                setMostrarAdmin(true)
              }

              style={styles.adminBtn}
            >
              Painel Admin
            </button>
          )
        }

        <button
          onClick={sair}
          disabled={saindo}
          style={styles.logout}
        >
          {
            saindo
              ? "Saindo..."
              : "Sair"
          }
        </button>

      </aside>

      <main style={styles.main}>

        <div style={styles.chatContainer}>

          <div style={styles.chatArea}>

            {historico.map(
              (msg, index) => (

              <div
                key={index}

                style={{
                  display: "flex",

                  justifyContent:

                    msg.tipo ===
                    "usuario"

                      ? "flex-end"

                      : "flex-start",
                }}
              >

                <div
                  style={{
                    ...styles.msg,

                    background:

                      msg.tipo ===
                      "usuario"

                        ? "#10b981"

                        : "#111827",
                  }}
                >
                  {msg.texto}
                </div>

              </div>
            ))}

            {loading && (

              <div
                style={{
                  color: "#4ade80",
                }}
              >
                IA analisando...
              </div>
            )}

            <div ref={finalChatRef} />

          </div>

          <div style={styles.inputArea}>

            <input
              value={mensagem}

              onChange={(e) =>
                setMensagem(
                  e.target.value
                )
              }

              placeholder="Como você está se sentindo?"

              style={styles.input}
            />

            <button
              onClick={
                enviarMensagem
              }

              style={styles.send}
            >
              Enviar
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

const styles = {

  container: {
    display: "flex",
    height: "100vh",
    background: "#020617",
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  sidebar: {
    width: 260,
    background: "#0f172a",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  logo: {
    fontSize: 32,
  },

  sub: {
    color: "#4ade80",
  },

  infoCard: {
    background: "#111827",
    padding: 18,
    borderRadius: 20,
    lineHeight: 2,
  },

  adminBtn: {
    border: "none",
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    fontWeight: "bold",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
  },

  logout: {
    marginTop: "auto",
    height: 50,
    border: "none",
    borderRadius: 14,
    background:
      "linear-gradient(90deg,#fb7185,#f9a8d4)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },

  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0f172a",
    borderRadius: 20,
    overflow: "hidden",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  msg: {
    maxWidth: "70%",
    padding: 14,
    borderRadius: 18,
    lineHeight: 1.6,
  },

  inputArea: {
    display: "flex",
    gap: 12,
    padding: 20,
    borderTop:
      "1px solid #1e293b",
  },

  input: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    border:
      "1px solid #1e293b",
    background:
      "#020617",
    color: "white",
    paddingLeft: 16,
    outline: "none",
  },

  send: {
    width: 120,
    border: "none",
    borderRadius: 14,
    background:
      "linear-gradient(90deg,#34d399,#22d3ee)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};