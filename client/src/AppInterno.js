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

      const emocaoDetectada =
        data
          ?.emocao_detectada
          ?.emocao ||
        "Equilibrado";

      setEstadoEmocional({

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
      });

      setHistoricoEmocional(
        (prev) => [

          emocaoDetectada,

          ...prev,
        ].slice(0, 5)
      );

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

          width: "340px",

          background:
            cores.sidebar,

          backdropFilter:
            "blur(14px)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 8px 40px rgba(0,0,0,0.25)",

          padding: "25px",

          display: "flex",

          flexDirection: "column",

          transition:
            "all 0.5s ease",
        }}
      >

        {/* AVATAR */}

        <div
          style={{

            width: "90px",

            height: "90px",

            borderRadius: "50%",

            background:
              "linear-gradient(135deg,#38bdf8,#2563eb)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            fontSize: "38px",

            marginBottom: "20px",

            boxShadow:
              "0 0 30px rgba(56,189,248,0.4)",
          }}
        >
          🧠
        </div>

        <h1
          style={{

            fontSize: "42px",

            marginBottom: "8px",
          }}
        >
          Neuro360
        </h1>

        <div
          style={{

            color: "#4ade80",

            marginBottom: "25px",

            fontWeight: "bold",
          }}
        >
          IA Terapêutica Ativa ✅
        </div>

        {/* STATUS */}

        <div
          style={{

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

        {/* ENERGIA */}

        <div
          style={{

            marginTop: "20px",
          }}
        >

          <div
            style={{

              marginBottom: "8px",

              color: "#cbd5e1",

              fontSize: "14px",
            }}
          >
            Energia emocional
          </div>

          <div
            style={{

              width: "100%",

              height: "10px",

              borderRadius: "999px",

              background:
                "rgba(255,255,255,0.08)",

              overflow: "hidden",
            }}
          >

            <div
              style={{

                width:
                  `${estadoEmocional.score}%`,

                height: "100%",

                background:
                  cores.card,

                transition:
                  "all 0.6s ease",
              }}
            />

          </div>

        </div>

        {/* HISTÓRICO */}

        <div
          style={{

            marginTop: "25px",
          }}
        >

          <div
            style={{

              marginBottom: "10px",

              fontWeight: "bold",

              color: "#cbd5e1",
            }}
          >
            Histórico emocional
          </div>

          <div
            style={{

              display: "flex",

              flexWrap: "wrap",

              gap: "8px",
            }}
          >

            {historicoEmocional.map(
              (emocao, index) => (

              <div
                key={index}

                style={{

                  background:
                    "rgba(255,255,255,0.08)",

                  padding:
                    "8px 12px",

                  borderRadius:
                    "999px",

                  fontSize: "13px",
                }}
              >
                {emocao}
              </div>
            ))}

          </div>

        </div>

        {/* SAIR */}

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
                }}
              >
                {msg.texto}
              </div>

            </div>
          ))}

          {/* TYPING */}

          {loading && (

            <div
              style={{

                display: "flex",

                gap: "8px",

                marginTop: "10px",
              }}
            >

              {[1,2,3].map((dot) => (

                <div
                  key={dot}

                  style={{

                    width: "10px",

                    height: "10px",

                    borderRadius:
                      "50%",

                    background:
                      "#4ade80",

                    animation:
                      "pulse 1s infinite",
                  }}
                />
              ))}

            </div>
          )}

          <div ref={finalChatRef} />

        </div>

        {/* EMOÇÕES */}

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

                      : "rgba(255,255,255,0.06)",

                  border:
                    emocaoAtiva ===
                    emocao.nome

                      ? "1px solid rgba(255,255,255,0.4)"

                      : "1px solid rgba(255,255,255,0.08)",

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

                  transform:
                    emocaoAtiva ===
                    emocao.nome

                      ? "scale(1.05)"

                      : "scale(1)",

                  boxShadow:
                    emocaoAtiva ===
                    emocao.nome

                      ? "0 0 25px rgba(56,189,248,0.35)"

                      : "0 0 15px rgba(0,0,0,0.15)",
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