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

  /* ======================================================
     STATES
  ====================================================== */

  const [mensagem, setMensagem] =
    useState("");

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [emocaoAtiva,
    setEmocaoAtiva] =
    useState("");

  const [historicoEmocional,
    setHistoricoEmocional] =
    useState([]);

  const [estadoEmocional,
    setEstadoEmocional] =
    useState({

      score: 82,

      hawkins: 540,

      consciencia: "Expansão",

      trilha: "Reequilíbrio",

      intervencao:
        "Respiração guiada",

      emocao: "Equilibrado",
    });

  const finalChatRef =
    useRef(null);

  /* ======================================================
     API
  ====================================================== */

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:3001";

  /* ======================================================
     AUTO SCROLL
  ====================================================== */

  useEffect(() => {

    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

  }, [historico, loading]);

  /* ======================================================
     HORÁRIO
  ====================================================== */

  function obterHorarioAtual() {

    return new Date()
      .toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
  }

  /* ======================================================
     ENTER
  ====================================================== */

  function handleKeyDown(e) {

    if (
      e.key === "Enter" &&
      !loading
    ) {

      enviarMensagem();
    }
  }

  /* ======================================================
     EMOÇÕES RÁPIDAS
  ====================================================== */

  const emocoesRapidas = [

    {
      emoji: "🟠",
      nome: "Ansioso",
      texto:
        "Estou me sentindo ansioso hoje",
    },

    {
      emoji: "🟡",
      nome: "Triste",
      texto:
        "Estou me sentindo triste hoje",
    },

    {
      emoji: "😊",
      nome: "Feliz",
      texto:
        "Hoje estou me sentindo feliz",
    },

    {
      emoji: "🟢",
      nome: "Motivado",
      texto:
        "Hoje estou me sentindo motivado",
    },

    {
      emoji: "🔴",
      nome: "Raiva",
      texto:
        "Estou com muita raiva hoje",
    },

    {
      emoji: "⚪",
      nome: "Sem foco",
      texto:
        "Estou sem foco hoje",
    },

    {
      emoji: "🩷",
      nome: "Sobrecarregado",
      texto:
        "Estou me sentindo sobrecarregado",
    },
  ];

  /* ======================================================
     CORES DINÂMICAS
  ====================================================== */

  function obterTemaEmocional() {

    const emocao =
      estadoEmocional.emocao
        ?.toLowerCase();

    if (
      emocao?.includes("ans")
    ) {

      return {

        glow:
          "rgba(251,146,60,0.55)",

        orb:
          "linear-gradient(135deg,#f97316,#fb923c,#fdba74)",

        card:
          "linear-gradient(135deg,#7c2d12,#ea580c)",

        border:
          "rgba(251,146,60,0.25)",
      };
    }

    if (
      emocao?.includes("triste")
    ) {

      return {

        glow:
          "rgba(59,130,246,0.55)",

        orb:
          "linear-gradient(135deg,#2563eb,#38bdf8,#7dd3fc)",

        card:
          "linear-gradient(135deg,#1e3a8a,#2563eb)",

        border:
          "rgba(59,130,246,0.25)",
      };
    }

    if (
      emocao?.includes("raiva")
    ) {

      return {

        glow:
          "rgba(239,68,68,0.55)",

        orb:
          "linear-gradient(135deg,#dc2626,#ef4444,#f87171)",

        card:
          "linear-gradient(135deg,#7f1d1d,#dc2626)",

        border:
          "rgba(239,68,68,0.25)",
      };
    }

    return {

      glow:
        "rgba(34,211,238,0.55)",

      orb:
        "linear-gradient(135deg,#06b6d4,#22d3ee,#67e8f9)",

      card:
        "linear-gradient(135deg,#0f172a,#111827)",

      border:
        "rgba(34,211,238,0.25)",
    };
  }

  const tema =
    obterTemaEmocional();

  /* ======================================================
     ENVIAR MSG
  ====================================================== */

  async function enviarMensagem() {

    if (
      !mensagem.trim() ||
      loading
    ) return;

    const horario =
      obterHorarioAtual();

    const novaMensagem = {

      tipo: "usuario",

      texto: mensagem,

      horario,
    };

    setHistorico((prev) => [
      ...prev,
      novaMensagem,
    ]);

    const textoUsuario =
      mensagem;

    setMensagem("");

    setLoading(true);

    try {

      const resposta =
        await fetch(
          `${API_URL}/ia`,
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
                usuario?.premium
                  ? "premium"
                  : "free",

              user_id:
                usuario?.email ||
                "anonimo",
            }),
          }
        );

      const data =
        await resposta.json();

      const respostaIA =
        data?.resposta ||
        "Não consegui responder agora.";

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto: respostaIA,

          horario:
            obterHorarioAtual(),
        },
      ]);

      const emocaoDetectada =
        data
          ?.emocao_detectada
          ?.emocao ||
        "Equilibrado";

      const novoEstado = {

        score:
          data?.score_emocional || 82,

        hawkins:
          data
            ?.frequencia_hawkins
            ?.frequencia || 540,

        consciencia:
          data
            ?.nivel_consciencia ||
          "Expansão",

        trilha:
          data
            ?.trilha_terapeutica ||
          "Reequilíbrio",

        intervencao:
          data?.intervencao ||
          "Respiração guiada",

        emocao:
          emocaoDetectada,
      };

      setEstadoEmocional(
        novoEstado
      );

      setHistoricoEmocional(
        (prev) => [

          {
            emocao:
              emocaoDetectada,

            score:
              novoEstado.score,

            horario:
              obterHorarioAtual(),
          },

          ...prev,
        ].slice(0, 10)
      );

    } catch (erro) {

      console.log(erro);

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            "Erro ao conectar com IA.",

          horario:
            obterHorarioAtual(),
        },
      ]);
    }

    setLoading(false);
  }

  /* ======================================================
     SAIR
  ====================================================== */

  function sair() {

    if (onLogout) {

      onLogout();

      return;
    }

    localStorage.clear();

    window.location.reload();
  }

  /* ======================================================
     GRÁFICO
  ====================================================== */

  const dadosGrafico =
    historicoEmocional
      .slice()
      .reverse()
      .map((item, index) => ({

        name:
          `${index + 1}`,

        score:
          item.score || 50,
      }));

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

  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <div
      style={{

        display: "flex",

        height: "100vh",

        overflow: "hidden",

        background:
          "linear-gradient(135deg,#020617,#0f172a,#111827)",

        color: "white",

        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{

          width: "340px",

          background:
            "rgba(255,255,255,0.03)",

          borderRight:
            `1px solid ${tema.border}`,

          padding: "30px",

          display: "flex",

          flexDirection: "column",

          backdropFilter:
            "blur(30px)",
        }}
      >

        {/* AVATAR IA */}

        <div
          style={{

            width: "120px",

            height: "120px",

            borderRadius: "50%",

            background:
              tema.orb,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            marginBottom: "30px",

            position: "relative",

            animation:
              "pulse 4s infinite ease-in-out",

            boxShadow:
              `0 0 60px ${tema.glow}`,
          }}
        >

          <div
            style={{

              width: "35px",

              height: "35px",

              borderRadius: "50%",

              background:
                "rgba(255,192,203,0.95)",

              boxShadow:
                "0 0 30px rgba(255,192,203,0.8)",
            }}
          />

        </div>

        <h1
          style={{

            fontSize: "60px",

            marginBottom: "10px",
          }}
        >
          NeuroMapa360
        </h1>

        <div
          style={{

            color: "#4ade80",

            fontWeight: "bold",

            marginBottom: "30px",
          }}
        >
          IA Terapêutica Ativa ✅
        </div>

        {/* STATUS */}

        <div
          style={{

            background:
              "rgba(255,255,255,0.05)",

            border:
              `1px solid ${tema.border}`,

            borderRadius: "22px",

            padding: "24px",

            lineHeight: "2",

            marginBottom: "25px",
          }}
        >

          <div>
            🧠 Emoção:
            {" "}
            {estadoEmocional.emocao}
          </div>

          <div>
            ◻️ Score:
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

          style={{

            marginTop: "auto",

            border: "none",

            borderRadius: "18px",

            padding: "18px",

            background:
              "linear-gradient(90deg,#fb7185,#fbcfe8)",

            color: "white",

            fontWeight: "bold",

            cursor: "pointer",
          }}
        >
          SAIR
        </button>

      </div>

      {/* ÁREA DIREITA */}

      <div
        style={{

          flex: 1,

          display: "flex",

          flexDirection: "column",

          padding: "30px",

          overflow: "hidden",
        }}
      >

        {/* TOPO */}

        <div
          style={{

            display: "grid",

            gridTemplateColumns:
              "1fr 1fr 1fr",

            gap: "20px",

            marginBottom: "25px",
          }}
        >

          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Score médio
            </div>

            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
              }}
            >
              {estadoEmocional.score}
            </div>
          </div>

          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Hawkins
            </div>

            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
              }}
            >
              {estadoEmocional.hawkins}
            </div>
          </div>

          <div>

            <div
              style={{
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Estado
            </div>

            <div
              style={{
                fontSize: "60px",
                fontWeight: "bold",
              }}
            >
              {estadoEmocional.emocao}
            </div>

          </div>

        </div>

        {/* DASHBOARD */}

        <div
          style={{

            display: "grid",

            gridTemplateColumns:
              "2fr 1fr",

            gap: "20px",

            marginBottom: "20px",
          }}
        >

          {/* GRÁFICO */}

          <div
            style={{

              background:
                "rgba(255,255,255,0.03)",

              border:
                `1px solid ${tema.border}`,

              borderRadius: "26px",

              padding: "20px",

              height: "240px",
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={dadosGrafico}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
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
                  stroke="#38bdf8"
                  strokeWidth={4}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          {/* DONUT */}

          <div
            style={{

              background:
                "rgba(255,255,255,0.03)",

              border:
                `1px solid ${tema.border}`,

              borderRadius: "26px",

              padding: "20px",

              height: "240px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={donutData}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >

                  <Cell
                    fill="#5eead4"
                  />

                  <Cell
                    fill="#1e293b"
                  />

                </Pie>

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* CHAT AREA */}

        <div
          style={{

            flex: 1,

            overflow: "hidden",

            display: "flex",

            flexDirection: "column",

            minHeight: 0,
          }}
        >

          {/* HISTÓRICO */}

          <div
            id="chat-scroll"

            style={{

              flex: 1,

              overflowY: "auto",

              paddingRight: "10px",

              paddingTop: "10px",

              display: "flex",

              flexDirection: "column",

              gap: "18px",

              minHeight: 0,
            }}
          >

            {historico.map(
              (msg, index) => (

              <div
                key={index}

                style={{

                  display: "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    msg.tipo ===
                    "usuario"

                      ? "flex-end"
                      : "flex-start",
                }}
              >

                <div
                  style={{

                    maxWidth: "72%",

                    padding: "22px",

                    borderRadius:
                      "24px",

                    lineHeight: "1.9",

                    fontSize: "17px",

                    background:
                      msg.tipo ===
                      "usuario"

                        ? "linear-gradient(90deg,#22c55e,#4ade80)"
                        : tema.card,

                    boxShadow:
                      "0 10px 40px rgba(0,0,0,0.25)",
                  }}
                >
                  {msg.texto}
                </div>

                <div
                  style={{

                    marginTop: "6px",

                    fontSize: "12px",

                    color:
                      "rgba(255,255,255,0.45)",
                  }}
                >
                  {msg.horario}
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
                IA analisando...
              </div>
            )}

            <div ref={finalChatRef} />

          </div>

          {/* EMOÇÕES */}

          <div
            style={{

              display: "flex",

              gap: "12px",

              flexWrap: "wrap",

              marginTop: "20px",

              marginBottom: "20px",
            }}
          >

            {emocoesRapidas.map(
              (emocao, index) => (

              <button
                key={index}

                onClick={() => {

                  setMensagem(
                    emocao.texto
                  );

                  setEmocaoAtiva(
                    emocao.nome
                  );
                }}

                style={{

                  border: "none",

                  padding:
                    "12px 18px",

                  borderRadius:
                    "999px",

                  background:
                    emocaoAtiva ===
                    emocao.nome

                      ? tema.card
                      : "rgba(255,255,255,0.05)",

                  color: "white",

                  cursor: "pointer",

                  fontWeight: "bold",
                }}
              >
                {emocao.emoji}
                {" "}
                {emocao.nome}
              </button>
            ))}

          </div>

          {/* INPUT */}

          <div
            style={{

              display: "flex",

              gap: "16px",
            }}
          >

            <input
              value={mensagem}

              onChange={(e) =>
                setMensagem(
                  e.target.value
                )
              }

              onKeyDown={
                handleKeyDown
              }

              placeholder="Como você está se sentindo?"

              style={{

                flex: 1,

                padding: "22px",

                borderRadius:
                  "22px",

                border:
                  `1px solid ${tema.border}`,

                background:
                  "rgba(255,255,255,0.05)",

                color: "white",

                fontSize: "17px",

                outline: "none",
              }}
            />

            <button
              onClick={
                enviarMensagem
              }

              disabled={loading}

              style={{

                border: "none",

                borderRadius:
                  "22px",

                padding:
                  "0 40px",

                background:
                  "linear-gradient(90deg,#4ade80,#5eead4)",

                color: "white",

                fontWeight: "bold",

                cursor: "pointer",
              }}
            >
              Enviar
            </button>

          </div>

        </div>

      </div>

      {/* ANIMAÇÃO */}

      <style>
        {`

          @keyframes pulse {

            0% {

              transform: scale(1);

            }

            50% {

              transform: scale(1.05);

            }

            100% {

              transform: scale(1);

            }
          }

        `}
      </style>

    </div>
  );
}