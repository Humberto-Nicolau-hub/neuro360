import React, {
  useState,
  useEffect,
  useRef,
} from "react";

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
     COR DINAMICA
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
          "linear-gradient(90deg,#1d4ed8,#3b82f6)",
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
          "linear-gradient(90deg,#dc2626,#ef4444)",
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

    if (
      emocao?.includes("deprim")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#111827,#1f2937)",

        card:
          "linear-gradient(90deg,#4b5563,#6b7280)",
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
     ENVIAR MENSAGEM
  ====================================================== */

  async function enviarMensagem() {

    if (
      !mensagem.trim() ||
      loading
    ) return;

    const novaMensagem = {

      tipo: "usuario",

      texto: mensagem,
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

      if (!resposta.ok) {

        throw new Error(
          "Erro servidor"
        );
      }

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
        },
      ]);

      let emocao =
        "Equilibrado";

      let score = 82;

      let hawkins = 540;

      let consciencia =
        "Expansão";

      let trilha =
        "Reequilíbrio";

      let intervencao =
        "Respiração guiada";

      const textoAnalise =
        (
          textoUsuario +
          " " +
          respostaIA
        ).toLowerCase();

      if (
        textoAnalise.includes(
          "ans"
        )
      ) {

        emocao =
          "Ansiedade";

        score = 42;

        hawkins = 125;

        consciencia =
          "Contração";

        trilha =
          "Acalmamento Neural";

        intervencao =
          "Respiração profunda";
      }

      if (
        textoAnalise.includes(
          "triste"
        )
      ) {

        emocao =
          "Tristeza";

        score = 28;

        hawkins = 75;

        consciencia =
          "Desmotivação";

        trilha =
          "Reconexão Emocional";

        intervencao =
          "Acolhimento terapêutico";
      }

      if (
        textoAnalise.includes(
          "raiva"
        )
      ) {

        emocao =
          "Raiva";

        score = 35;

        hawkins = 150;

        consciencia =
          "Reatividade";

        trilha =
          "Descompressão";

        intervencao =
          "Relaxamento neural";
      }

      if (
        textoAnalise.includes(
          "feliz"
        )
      ) {

        emocao =
          "Feliz";

        score = 96;

        hawkins = 780;

        consciencia =
          "Plenitude";

        trilha =
          "Expansão Positiva";

        intervencao =
          "Potencialização emocional";
      }

      if (
        textoAnalise.includes(
          "deprim"
        )
      ) {

        emocao =
          "Deprimido";

        score = 18;

        hawkins = 50;

        consciencia =
          "Desconexão";

        trilha =
          "Reconstrução Emocional";

        intervencao =
          "Apoio terapêutico profundo";
      }

      setEstadoEmocional({

        score,

        hawkins,

        consciencia,

        trilha,

        intervencao,

        emocao,
      });

    } catch (erro) {

      console.error(erro);

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            "Erro ao conectar com IA terapêutica.",
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
     RENDER
  ====================================================== */

  return (

    <div
      style={{

        display: "flex",

        height: "100vh",

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

          width: "320px",

          background:
            cores.sidebar,

          backdropFilter:
            "blur(14px)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 8px 40px rgba(0,0,0,0.25)",

          padding: "25px",

          borderRight:
            "1px solid rgba(255,255,255,0.1)",

          display: "flex",

          flexDirection: "column",

          transition:
            "all 0.5s ease",
        }}
      >

        <h1
          style={{

            fontSize: "48px",

            marginBottom: "15px",

            fontWeight: "bold",
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

        {usuario?.admin && (

          <button
            style={{

              background:
                cores.card,

              border: "none",

              padding: "16px",

              borderRadius:
                "14px",

              color: "white",

              fontWeight:
                "bold",

              marginBottom:
                "20px",

              cursor: "pointer",

              boxShadow:
                "0 0 20px rgba(0,0,0,0.2)",
            }}
          >
            ADMIN 👑
          </button>
        )}

        {/* STATUS */}

        <div
          style={{

            marginTop: "20px",

            background:
              "rgba(255,255,255,0.06)",

            backdropFilter:
              "blur(14px)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            boxShadow:
              "0 8px 40px rgba(0,0,0,0.25)",

            padding: "22px",

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
            {estadoEmocional.consciencia}
          </div>

          <div>
            🛤️ Trilha:
            {" "}
            {estadoEmocional.trilha}
          </div>

          <div>
            ⚡ Intervenção:
            {" "}
            {estadoEmocional.intervencao}
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

        {/* BOTÃO SAIR */}

        <button
          onClick={sair}

          style={{

            marginTop: "auto",

            background:
              "linear-gradient(90deg,#ef4444,#fb7185)",

            border: "none",

            padding: "15px",

            borderRadius:
              "14px",

            color: "white",

            fontWeight: "bold",

            cursor: "pointer",

            marginBottom: "10px",
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

        {/* HISTÓRICO */}

        <div
          style={{

            flex: 1,

            overflowY: "auto",

            marginBottom: "20px",

            paddingRight: "10px",
          }}
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

                marginBottom:
                  "20px",
              }}
            >

              <div
                style={{

                  maxWidth: "75%",

                  padding: "22px",

                  borderRadius:
                    "20px",

                  lineHeight: "1.9",

                  fontSize: "17px",

                  whiteSpace:
                    "pre-wrap",

                  backdropFilter:
                    "blur(10px)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  boxShadow:
                    "0 8px 30px rgba(0,0,0,0.25)",

                  background:
                    msg.tipo ===
                    "usuario"

                      ? "linear-gradient(90deg,#22c55e,#4ade80)"

                      : cores.card,

                  transition:
                    "all 0.5s ease",
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

                marginTop: "10px",

                fontSize: "15px",
              }}
            >
              IA analisando...
            </div>
          )}

          <div ref={finalChatRef} />

        </div>

        {/* EMOÇÕES RÁPIDAS */}

        <div
          style={{

            marginBottom: "20px",
          }}
        >

          <div
            style={{

              marginBottom: "14px",

              fontSize: "15px",

              color: "#cbd5e1",

              fontWeight: "bold",
            }}
          >
            Como você está se sentindo hoje?
          </div>

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

                onClick={() =>
                  setMensagem(
                    emocao.texto
                  )
                }

                style={{

                  background:
                    "rgba(255,255,255,0.06)",

                  backdropFilter:
                    "blur(12px)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  padding:
                    "12px 18px",

                  borderRadius:
                    "999px",

                  color: "white",

                  cursor: "pointer",

                  fontSize: "14px",

                  fontWeight: "bold",

                  transition:
                    "all 0.3s ease",

                  boxShadow:
                    "0 0 15px rgba(0,0,0,0.15)",
                }}

                onMouseEnter={(e) => {

                  e.target.style.transform =
                    "scale(1.05)";

                  e.target.style.background =
                    "rgba(255,255,255,0.15)";
                }}

                onMouseLeave={(e) => {

                  e.target.style.transform =
                    "scale(1)";

                  e.target.style.background =
                    "rgba(255,255,255,0.06)";
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

            onKeyDown={
              handleKeyDown
            }

            onChange={(e) =>
              setMensagem(
                e.target.value
              )
            }

            placeholder="Como você está se sentindo?"

            disabled={loading}

            style={{

              flex: 1,

              padding: "18px",

              borderRadius:
                "14px",

              border:
                "1px solid rgba(255,255,255,0.08)",

              background:
                "rgba(255,255,255,0.06)",

              backdropFilter:
                "blur(12px)",

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
                "18px 30px",

              borderRadius:
                "14px",

              color: "white",

              fontWeight:
                "bold",

              cursor: "pointer",

              opacity:
                loading
                  ? 0.7
                  : 1,
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