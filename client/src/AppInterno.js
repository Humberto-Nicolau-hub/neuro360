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

  const [modoFoco,
    setModoFoco] =
    useState(false);

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
     EMOÇÕES RÁPIDAS
  ====================================================== */

  const emocoesRapidas = [

    {
      emoji: "🟣",
      nome: "Ansioso",
      texto:
        "Estou me sentindo ansioso hoje",
    },

    {
      emoji: "🟤",
      nome: "Cansado",
      texto:
        "Estou mentalmente cansado",
    },

    {
      emoji: "🟡",
      nome: "Confuso",
      texto:
        "Estou me sentindo confuso",
    },

    {
      emoji: "😔",
      nome: "Deprimido",
      texto:
        "Estou me sentindo deprimido",
    },

    {
      emoji: "✨",
      nome: "Esperançoso",
      texto:
        "Estou me sentindo esperançoso",
    },

    {
      emoji: "😄",
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
      emoji: "🟠",
      nome: "Raiva",
      texto:
        "Estou com muita raiva hoje",
    },

    {
      emoji: "⚫",
      nome: "Sem foco",
      texto:
        "Estou sem foco hoje",
    },

    {
      emoji: "🔴",
      nome: "Sobrecarregado",
      texto:
        "Estou me sentindo sobrecarregado",
    },

    {
      emoji: "🔵",
      nome: "Triste",
      texto:
        "Estou me sentindo triste hoje",
    },
  ];

  /* ======================================================
     API
  ====================================================== */

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://neuro360-tkyx.onrender.com";

  /* ======================================================
     AUTO SCROLL
  ====================================================== */

  useEffect(() => {

    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
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
     COR DINÂMICA
  ====================================================== */

  function obterCorEmocional() {

    const emocao =
      estadoEmocional.emocao
        ?.toLowerCase();

    if (
      emocao?.includes("triste")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#172554,#1e3a8a)",

        card:
          "linear-gradient(90deg,#1d4ed8,#38bdf8)",
      };
    }

    if (
      emocao?.includes("ans")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#3f1d0d,#7c2d12)",

        card:
          "linear-gradient(90deg,#ea580c,#fb923c)",
      };
    }

    if (
      emocao?.includes("raiva")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#450a0a,#7f1d1d)",

        card:
          "linear-gradient(90deg,#dc2626,#f87171)",
      };
    }

    if (
      emocao?.includes("feliz")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#064e3b,#065f46)",

        card:
          "linear-gradient(90deg,#10b981,#34d399)",
      };
    }

    return {

      sidebar:
        "linear-gradient(180deg,#0f172a,#1e293b)",

      card:
        "linear-gradient(90deg,#2563eb,#38bdf8)",
    };
  }

  const cores =
    obterCorEmocional();

  /* ======================================================
     INSIGHT AUTOMÁTICO
  ====================================================== */

  function gerarInsight() {

    const score =
      estadoEmocional.score;

    if (score <= 35) {

      return "Há sinais emocionais de sobrecarga. A desaceleração terapêutica pode ajudar.";
    }

    if (score <= 60) {

      return "Você apresenta oscilações emocionais moderadas nas últimas interações.";
    }

    if (score >= 80) {

      return "Seu padrão emocional demonstra evolução cognitiva positiva.";
    }

    return "Seu estado emocional está em processo de estabilização.";
  }

  /* ======================================================
     ENVIAR
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
                  : "terapeutico",

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
        ].slice(0, 7)
      );

    } catch (erro) {

      console.error(erro);

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            "Erro ao conectar com IA terapêutica.",

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
     DADOS GRÁFICO
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

  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <div
      style={{

        display: "flex",

        height: "100vh",

        background:
          modoFoco
            ? "#020617"
            : "linear-gradient(135deg,#020617,#0f172a,#111827)",

        color: "white",

        fontFamily:
          "Arial, sans-serif",

        transition:
          "all 0.5s ease",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{

          width:
            modoFoco
              ? "260px"
              : "340px",

          background:
            cores.sidebar,

          padding: "25px",

          display: "flex",

          flexDirection: "column",

          borderRight:
            "1px solid rgba(255,255,255,0.08)",

          backdropFilter:
            "blur(16px)",

          transition:
            "all 0.5s ease",
        }}
      >

        <div
          style={{

            width: "90px",

            height: "90px",

            borderRadius: "50%",

            background:
              cores.card,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            fontSize: "38px",

            marginBottom: "20px",

            boxShadow:
              "0 0 40px rgba(56,189,248,0.35)",
          }}
        >
          🧠
        </div>

        <h1
          style={{
            fontSize: "48px",
          }}
        >
          Neuro360
        </h1>

        <div
          style={{

            color: "#4ade80",

            marginBottom: "20px",

            fontWeight: "bold",
          }}
        >
          IA Terapêutica Ativa ✅
        </div>

        {/* MODO FOCO */}

        <button
          onClick={() =>
            setModoFoco(
              !modoFoco
            )
          }

          style={{

            background:
              "rgba(255,255,255,0.08)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            padding: "14px",

            borderRadius: "14px",

            color: "white",

            marginBottom: "20px",

            cursor: "pointer",
          }}
        >
          {
            modoFoco
              ? "🧘 Modo Normal"
              : "🎯 Modo Foco TDAH"
          }
        </button>

        {/* DASHBOARD */}

        <div
          style={{

            background:
              "rgba(255,255,255,0.05)",

            padding: "20px",

            borderRadius: "18px",

            lineHeight: "2",
          }}
        >

          <div>
            🧠 Emoção:
            {" "}
            {estadoEmocional.emocao}
          </div>

          <div>
            📄 Score:
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
            {
              estadoEmocional.consciencia
            }
          </div>

          <div>
            🛤️ Trilha:
            {" "}
            {
              estadoEmocional.trilha
            }
          </div>

          <div>
            👤 Plano:
            {" "}
            {
              usuario?.premium
                ? "Premium"
                : "Free"
            }
          </div>

        </div>

        {/* INSIGHT */}

        <div
          style={{

            marginTop: "20px",

            background:
              "rgba(255,255,255,0.05)",

            padding: "18px",

            borderRadius: "18px",

            lineHeight: "1.8",

            fontSize: "14px",

            color: "#cbd5e1",
          }}
        >
          💡
          {" "}
          {gerarInsight()}
        </div>

        {/* TIMELINE */}

        <div
          style={{
            marginTop: "20px",
          }}
        >

          <div
            style={{
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            Timeline emocional
          </div>

          <div
            style={{

              display: "flex",

              flexDirection:
                "column",

              gap: "10px",
            }}
          >

            {historicoEmocional
              .slice(0, 5)
              .map(
                (
                  item,
                  index
                ) => (

                <div
                  key={index}

                  style={{

                    background:
                      "rgba(255,255,255,0.05)",

                    padding:
                      "10px 14px",

                    borderRadius:
                      "14px",

                    fontSize: "13px",
                  }}
                >
                  ⏰
                  {" "}
                  {item.horario}
                  {" — "}
                  {item.emocao}
                </div>
              ))}

          </div>

        </div>

        <button
          onClick={sair}

          style={{

            marginTop: "auto",

            background:
              "linear-gradient(90deg,#ef4444,#fb7185)",

            border: "none",

            padding: "16px",

            borderRadius: "14px",

            color: "white",

            fontWeight: "bold",

            cursor: "pointer",
          }}
        >
          SAIR
        </button>

      </div>

      {/* CHAT */}

      <div
        style={{

          flex: 1,

          display: "flex",

          flexDirection: "column",

          padding: "30px",
        }}
      >

        {/* GRÁFICO */}

        <div
          style={{

            height: "180px",

            background:
              "rgba(255,255,255,0.04)",

            borderRadius: "20px",

            padding: "20px",

            marginBottom: "20px",
          }}
        >

          <div
            style={{
              marginBottom: "15px",
              fontWeight: "bold",
            }}
          >
            Evolução emocional
          </div>

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={dadosGrafico}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
              />

              <XAxis
                dataKey="name"
                stroke="#94a3b8"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="score"
                stroke="#38bdf8"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        {/* CHAT HISTÓRICO */}

        <div
          style={{

            flex: 1,

            overflowY: "auto",

            marginBottom: "20px",
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

                marginBottom:
                  "24px",
              }}
            >

              <div
                style={{

                  maxWidth: "72%",

                  padding: "22px",

                  borderRadius:
                    "22px",

                  lineHeight: "1.8",

                  fontSize: "17px",

                  background:
                    msg.tipo ===
                    "usuario"

                      ? "linear-gradient(90deg,#22c55e,#4ade80)"

                      : cores.card,

                  boxShadow:
                    "0 10px 35px rgba(0,0,0,0.25)",
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
            marginBottom: "18px",
          }}
        >

          <div
            style={{

              display: "flex",

              flexWrap: "wrap",

              gap: "12px",
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

                  background:
                    emocaoAtiva ===
                    emocao.nome

                      ? cores.card

                      : "rgba(255,255,255,0.05)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  padding:
                    "12px 18px",

                  borderRadius:
                    "999px",

                  color: "white",

                  cursor: "pointer",

                  fontWeight: "bold",

                  transform:
                    emocaoAtiva ===
                    emocao.nome

                      ? "scale(1.06)"

                      : "scale(1)",

                  transition:
                    "all 0.3s ease",
                }}
              >
                {emocao.emoji}
                {" "}
                {emocao.nome}
              </button>
            ))}

          </div>

        </div>

        {/* INPUT */}

        <div
          style={{

            display: "flex",

            gap: "12px",
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

              padding: "20px",

              borderRadius: "16px",

              border:
                "1px solid rgba(255,255,255,0.08)",

              background:
                "rgba(255,255,255,0.05)",

              color: "white",

              fontSize: "16px",

              outline: "none",
            }}
          />

          <button
            onClick={
              enviarMensagem
            }

            disabled={loading}

            style={{

              background:
                "linear-gradient(90deg,#22c55e,#4ade80)",

              border: "none",

              padding:
                "20px 34px",

              borderRadius:
                "16px",

              color: "white",

              fontWeight:
                "bold",

              cursor: "pointer",
            }}
          >
            {loading
              ? "..."
              : "Enviar"}
          </button>

        </div>

      </div>

    </div>
  );
}