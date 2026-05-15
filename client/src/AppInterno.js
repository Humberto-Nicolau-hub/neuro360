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
} from "recharts";

import AdminDashboard from "./AdminDashboard";

export default function AppInterno({
  usuario,
  onLogout,
}) {

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

  const [emocaoSelecionada,
    setEmocaoSelecionada] =
      useState("");

  const chatAreaRef =
    useRef(null);

  /* =========================================
     PROTEÇÃO ANTI LOOP
  ========================================= */

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

  /* =========================================
     AUTO SCROLL CONTROLADO
  ========================================= */

  useEffect(() => {

    if (chatAreaRef.current) {

      chatAreaRef.current.scrollTop =
        chatAreaRef.current.scrollHeight;
    }

  }, [historico, loading]);

  /* =========================================
     ADMIN
  ========================================= */

  const isAdmin =
    usuario?.admin === true;

  const plano =
    isAdmin
      ? "ADMIN PREMIUM"
      : (
          usuario?.plano || "FREE"
        ).toUpperCase();

  /* =========================================
     ESTADO EMOCIONAL
  ========================================= */

  const estado = {
    score: 82,
    hawkins: 540,
    consciencia: "Expansão",
    trilha: "Reequilíbrio",
    emocao:
      emocaoSelecionada || "Equilibrado",
  };

  const graficoData = [
    { dia: 1, valor: 72 },
    { dia: 2, valor: 76 },
    { dia: 3, valor: 81 },
    { dia: 4, valor: 82 },
  ];

  /* =========================================
     LOGOUT
  ========================================= */

  async function sair() {

    if (saindo) return;

    try {

      setSaindo(true);

      localStorage.clear();

      sessionStorage.clear();

      if (onLogout) {

        await onLogout();
      }

    } catch (erro) {

      console.log(erro);

    } finally {

      window.location.href = "/";
    }
  }

  /* =========================================
     CHAT IA
  ========================================= */

  async function enviarMensagem() {

    if (!mensagem.trim()) return;

    const texto = mensagem;

    setHistorico((prev) => [
      ...prev,
      {
        tipo: "usuario",
        texto,
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
              mensagem: texto,
              perfil: plano,
              premium:
                isAdmin ||
                usuario?.premium,
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

  /* =========================================
     ADMIN DASHBOARD
  ========================================= */

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

  /* =========================================
     LISTA EMOÇÕES ORDENADA
  ========================================= */

  const emocoes = [
    "Ansioso",
    "Cansado",
    "Confuso",
    "Deprimido",
    "Desmotivado",
    "Esperançoso",
    "Feliz",
    "Motivado",
    "Procrastinador",
    "Raiva",
    "Sem foco",
    "Triste",
  ];

  /* =========================================
     RENDER
  ========================================= */

  return (

    <div style={styles.container}>

      <aside style={styles.sidebar}>

        <div
          style={styles.avatar}
        />

        <h1 style={styles.logo}>
          NeuroMapa360
        </h1>

        <p style={styles.sub}>
          IA Terapêutica Ativa
        </p>

        <div style={styles.plano}>
          Plano:
          {" "}
          {plano}
        </div>

        {
          isAdmin && (
            <div style={styles.master}>
              ADMIN MASTER
            </div>
          )
        }

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

        <div style={styles.infoCard}>

          <div>
            👤 {usuario?.email}
          </div>

          <div>
            🧠 Emoção:
            {" "}
            {estado.emocao}
          </div>

          <div>
            📊 Score:
            {" "}
            {estado.score}
          </div>

          <div>
            🔥 Hawkins:
            {" "}
            {estado.hawkins}
          </div>

          <div>
            🌐 Consciência:
            {" "}
            {estado.consciencia}
          </div>

          <div>
            🛤️ Trilha:
            {" "}
            {estado.trilha}
          </div>

        </div>

        <button
          onClick={sair}
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

        <div style={styles.topCards}>

          <div style={styles.card}>
            <h3>Score</h3>
            <h1>82</h1>
          </div>

          <div style={styles.card}>
            <h3>Hawkins</h3>
            <h1>540</h1>
          </div>

          <div style={styles.card}>
            <h3>Estado</h3>
            <h1>{estado.emocao}</h1>
          </div>

        </div>

        <div style={styles.graphCard}>

          <ResponsiveContainer
            width="100%"
            height={120}
          >

            <LineChart data={graficoData}>

              <CartesianGrid
                stroke="#1e293b"
              />

              <XAxis dataKey="dia" />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="valor"
                stroke="#22d3ee"
                strokeWidth={4}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <div style={styles.emocoes}>

          {emocoes.map((emocao) => (

            <button
              key={emocao}

              onClick={() => {

                setEmocaoSelecionada(
                  emocao
                );

                setMensagem(
                  `Estou me sentindo ${emocao}`
                );
              }}

              style={{
                ...styles.emocaoBtn,

                background:
                  emocaoSelecionada === emocao
                    ? "linear-gradient(90deg,#facc15,#f59e0b)"
                    : "linear-gradient(90deg,#38bdf8,#22d3ee)",
              }}
            >
              {emocao}
            </button>

          ))}

        </div>

        <div style={styles.chatContainer}>

          <div
            ref={chatAreaRef}
            style={styles.chatArea}
          >

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
                  fontWeight: "bold",
                }}
              >
                IA analisando emoções...
              </div>
            )}

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
    overflow: "hidden",
  },

  sidebar: {
    width: 300,
    background: "#0f172a",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background:
      "linear-gradient(90deg,#22d3ee,#67e8f9)",
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
  },

  sub: {
    color: "#4ade80",
    fontWeight: "bold",
  },

  plano: {
    color: "#facc15",
    fontWeight: "bold",
  },

  master: {
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  adminBtn: {
    border: "none",
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    fontWeight: "bold",
    padding: "14px",
    borderRadius: 14,
    cursor: "pointer",
  },

  infoCard: {
    background: "#111827",
    padding: 18,
    borderRadius: 20,
    lineHeight: 2,
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
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    overflow: "hidden",
  },

  topCards: {
    display: "flex",
    gap: 20,
  },

  card: {
    flex: 1,
    background: "#111827",
    padding: 20,
    borderRadius: 20,
  },

  graphCard: {
    background: "#111827",
    borderRadius: 20,
    padding: 10,
    minHeight: 140,
    maxHeight: 140,
  },

  emocoes: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  emocaoBtn: {
    border: "none",
    borderRadius: 30,
    padding: "12px 18px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s",
  },

  chatContainer: {
    flex: 1,
    minHeight: 0,
    background: "#0f172a",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
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