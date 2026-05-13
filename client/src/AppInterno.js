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

  const finalChatRef =
    useRef(null);

  const plano =
    usuario?.plano || "free";

  const emotionStyles = {

    Ansioso: {
      background:
        "rgba(249,115,22,0.18)",
      color: "#fdba74",
      border:
        "1px solid #fb923c",
    },

    Cansado: {
      background:
        "rgba(107,114,128,0.18)",
      color: "#d1d5db",
      border:
        "1px solid #9ca3af",
    },

    Confuso: {
      background:
        "rgba(99,102,241,0.18)",
      color: "#a5b4fc",
      border:
        "1px solid #818cf8",
    },

    Deprimido: {
      background:
        "rgba(30,58,138,0.25)",
      color: "#93c5fd",
      border:
        "1px solid #3b82f6",
    },

    Esperançoso: {
      background:
        "rgba(6,182,212,0.18)",
      color: "#67e8f9",
      border:
        "1px solid #22d3ee",
    },

    Feliz: {
      background:
        "rgba(234,179,8,0.18)",
      color: "#fde047",
      border:
        "1px solid #facc15",
    },

    Motivado: {
      background:
        "rgba(34,197,94,0.18)",
      color: "#86efac",
      border:
        "1px solid #4ade80",
    },

    Raiva: {
      background:
        "rgba(239,68,68,0.18)",
      color: "#fca5a5",
      border:
        "1px solid #ef4444",
    },

    "Sem foco": {
      background:
        "rgba(71,85,105,0.18)",
      color: "#cbd5e1",
      border:
        "1px solid #64748b",
    },

    Sobrecarregado: {
      background:
        "rgba(168,85,247,0.18)",
      color: "#d8b4fe",
      border:
        "1px solid #a855f7",
    },

    Triste: {
      background:
        "rgba(59,130,246,0.18)",
      color: "#93c5fd",
      border:
        "1px solid #3b82f6",
    },
  };

  const emotions = [

    "Ansioso",
    "Cansado",
    "Confuso",
    "Deprimido",
    "Esperançoso",
    "Feliz",
    "Motivado",
    "Raiva",
    "Sem foco",
    "Sobrecarregado",
    "Triste",
  ];

  const [estadoEmocional] =
    useState({

      score: 82,

      hawkins: 540,

      consciencia:
        "Expansão",

      trilha:
        "Reequilíbrio",

      emocao:
        "Equilibrado",
    });

  useEffect(() => {

    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [historico]);

  async function enviarMensagem() {

    if (!mensagem.trim()) return;

    const textoUsuario =
      mensagem;

    const novaMensagem = {

      tipo: "usuario",

      texto:
        textoUsuario,
    };

    setHistorico((prev) => [
      ...prev,
      novaMensagem,
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
                plano === "premium" ||
                plano === "admin_premium",

              user_id:
                usuario?.id ||
                usuario?.email ||
                "anonimo",

              email:
                usuario?.email,
            }),
          }
        );

      if (!response.ok) {

        throw new Error(
          "Erro no backend"
        );
      }

      const data =
        await response.json();

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:

            data.resposta ||

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
            "A IA terapêutica está temporariamente indisponível. Tente novamente em alguns instantes.",
        },
      ]);

    } finally {

      setLoading(false);
    }
  }

  const dadosGrafico = [

    { name: "1", score: 60 },

    { name: "2", score: 65 },

    { name: "3", score: 70 },

    { name: "4", score: 82 },
  ];

  const donutData = [

    {
      name: "score",
      value:
        estadoEmocional.score,
    },

    {
      name: "restante",
      value:
        100 -
        estadoEmocional.score,
    },
  ];

  function sair() {

    if (onLogout)
      onLogout();
  }

  return (

    <div style={styles.container}>

      <aside style={styles.sidebar}>

        <div
          style={styles.logoOrb}
        />

        <h1 style={styles.logo}>
          NeuroMapa360
        </h1>

        <p style={styles.sub}>
          IA Terapêutica Ativa
        </p>

        <div style={styles.planoBadge}>

          Plano:
          {" "}

          <span
            style={{
              color:

                plano ===
                "admin_premium"

                  ? "#f472b6"

                  : plano ===
                    "premium"

                    ? "#4ade80"

                    : "#60a5fa",

              fontWeight:
                "bold",
            }}
          >
            {plano.toUpperCase()}
          </span>

        </div>

        <div style={styles.infoCard}>

          <div>
            👤 {usuario?.nome}
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

          <div>
            🔥 Hawkins:
            {" "}
            {estadoEmocional.hawkins}
          </div>

          <div>
            🌎 Consciência:
            {" "}
            {estadoEmocional.consciencia}
          </div>

          <div>
            🛤️ Trilha:
            {" "}
            {estadoEmocional.trilha}
          </div>

        </div>

        <button
          onClick={sair}
          style={styles.logout}
        >
          Sair
        </button>

      </aside>

      <main style={styles.main}>

        <div style={styles.topGrid}>

          <div style={styles.metricCard}>

            <span style={styles.metricLabel}>
              Score
            </span>

            <h2 style={styles.metricValue}>
              {estadoEmocional.score}
            </h2>

          </div>

          <div style={styles.metricCard}>

            <span style={styles.metricLabel}>
              Hawkins
            </span>

            <h2 style={styles.metricValue}>
              {estadoEmocional.hawkins}
            </h2>

          </div>

          <div style={styles.metricCard}>

            <span style={styles.metricLabel}>
              Estado
            </span>

            <h2 style={styles.metricValue}>
              {estadoEmocional.emocao}
            </h2>

          </div>

        </div>

        <div style={styles.chartGrid}>

          <div style={styles.chartCard}>

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={dadosGrafico}
              >

                <CartesianGrid
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <div style={styles.chartCard}>

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={donutData}
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                >

                  <Cell fill="#5eead4" />

                  <Cell fill="#1e293b" />

                </Pie>

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

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

          <div style={styles.emocoes}>

            {emotions.map(
              (emotion) => (

              <button
                key={emotion}

                onClick={() =>
                  setMensagem(
                    `Estou me sentindo ${emotion}`
                  )
                }

                style={{
                  ...styles.emocaoBtn,

                  ...emotionStyles[
                    emotion
                  ],
                }}
              >
                {emotion}
              </button>
            ))}

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

    background:
      "#020617",

    color: "white",

    overflow: "hidden",

    fontFamily:
      "Inter, sans-serif",
  },

  sidebar: {

    width: 260,

    background:
      "#0f172a",

    borderRight:
      "1px solid #1e293b",

    padding: 24,

    display: "flex",

    flexDirection: "column",

    gap: 20,
  },

  logoOrb: {

    width: 70,

    height: 70,

    borderRadius: "50%",

    background:
      "linear-gradient(135deg,#22d3ee,#67e8f9)",

    boxShadow:
      "0 0 40px rgba(34,211,238,0.4)",
  },

  logo: {

    fontSize: 34,

    margin: 0,
  },

  sub: {

    color: "#4ade80",

    fontSize: 14,
  },

  planoBadge: {

    background: "#111827",

    border:
      "1px solid #1e293b",

    borderRadius: 14,

    padding: "10px 14px",

    fontSize: 13,

    width: "fit-content",
  },

  infoCard: {

    background:
      "#111827",

    border:
      "1px solid #1e293b",

    borderRadius: 20,

    padding: 18,

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

    padding: 24,

    display: "flex",

    flexDirection: "column",

    gap: 20,

    overflow: "hidden",
  },

  topGrid: {

    display: "grid",

    gridTemplateColumns:
      "repeat(3,1fr)",

    gap: 18,
  },

  metricCard: {

    background:
      "#111827",

    border:
      "1px solid #1e293b",

    borderRadius: 20,

    padding: 20,
  },

  metricLabel: {

    color: "#94a3b8",

    fontSize: 14,
  },

  metricValue: {

    fontSize: 38,

    marginTop: 10,
  },

  chartGrid: {

    display: "grid",

    gridTemplateColumns:
      "2fr 1fr",

    gap: 18,

    height: 220,
  },

  chartCard: {

    background:
      "#111827",

    border:
      "1px solid #1e293b",

    borderRadius: 20,

    padding: 18,
  },

  chatContainer: {

    flex: 1,

    display: "flex",

    flexDirection: "column",

    background:
      "#0f172a",

    borderRadius: 20,

    border:
      "1px solid #1e293b",

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

  emocoes: {

    display: "flex",

    flexWrap: "wrap",

    gap: 10,

    padding: "16px 20px 0px",
  },

  emocaoBtn: {

    borderRadius: 999,

    padding: "10px 16px",

    cursor: "pointer",

    fontSize: 13,

    fontWeight: "600",

    transition: "0.2s",

    backdropFilter:
      "blur(10px)",
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