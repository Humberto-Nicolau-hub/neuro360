import React, {
  useState,
  useEffect,
  useRef,
} from "react";

export default function AppInterno() {

  const [mensagem, setMensagem] =
    useState("");

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const finalChatRef = useRef(null);

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
     ENVIAR MENSAGEM
  ====================================================== */

  async function enviarMensagem() {

    if (!mensagem.trim()) return;

    const novaMensagem = {
      tipo: "usuario",
      texto: mensagem,
    };

    setHistorico((prev) => [
      ...prev,
      novaMensagem,
    ]);

    const textoUsuario = mensagem;

    setMensagem("");

    setLoading(true);

    try {

      const resposta = await fetch(
        `${API_URL}/ia`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            mensagem: textoUsuario,
            perfil: "terapeutico",
          }),
        }
      );

      const data =
        await resposta.json();

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
          "linear-gradient(135deg,#0f172a,#111827,#1e293b)",

        color: "white",

        fontFamily: "Arial",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{
          width: "320px",

          background:
            "rgba(255,255,255,0.05)",

          padding: "25px",

          borderRight:
            "1px solid rgba(255,255,255,0.1)",

          display: "flex",

          flexDirection: "column",
        }}
      >

        <h1
          style={{
            fontSize: "52px",

            marginBottom: "20px",
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

        <button
          style={{
            background:
              "linear-gradient(90deg,#2563eb,#38bdf8)",

            border: "none",

            padding: "18px",

            borderRadius: "12px",

            color: "white",

            fontWeight: "bold",

            marginBottom: "20px",

            cursor: "pointer",
          }}
        >
          ADMIN 👑
        </button>

        <div
          style={{
            marginTop: "30px",

            opacity: 0.9,

            lineHeight: "2",
          }}
        >
          <div>🧠 Estado Cognitivo</div>
          <div>📄 Score: 82</div>
          <div>🔥 Hawkins: 540</div>
          <div>🌎 Consciência: Expansão</div>
          <div>🛤️ Trilha: Reequilíbrio</div>
          <div>⚙️ Protocolo: NeuroReset</div>
          <div>⚡ Intervenção: Respiração guiada</div>
        </div>

        <button
          onClick={sair}
          style={{
            marginTop: "auto",

            background: "#ef4444",

            border: "none",

            padding: "15px",

            borderRadius: "12px",

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

        <div
          style={{
            flex: 1,

            overflowY: "auto",

            marginBottom: "20px",

            paddingRight: "10px",
          }}
        >

          {historico.map((msg, index) => (

            <div
              key={index}
              style={{
                display: "flex",

                justifyContent:
                  msg.tipo === "usuario"
                    ? "flex-end"
                    : "flex-start",

                marginBottom: "20px",
              }}
            >

              <div
                style={{
                  maxWidth: "70%",

                  padding: "20px",

                  borderRadius: "18px",

                  lineHeight: "1.7",

                  fontSize: "18px",

                  whiteSpace: "pre-wrap",

                  background:
                    msg.tipo === "usuario"
                      ? "linear-gradient(90deg,#22c55e,#4ade80)"
                      : "linear-gradient(90deg,#1d4ed8,#3b82f6)",
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
              }}
            >
              IA analisando...
            </div>
          )}

          {/* FINAL DO CHAT */}

          <div ref={finalChatRef} />

        </div>

        {/* INPUT */}

        <div
          style={{
            display: "flex",

            gap: "10px",
          }}
        >

          <input
            value={mensagem}

            onChange={(e) =>
              setMensagem(
                e.target.value
              )
            }

            placeholder="Como você está se sentindo?"

            style={{
              flex: 1,

              padding: "18px",

              borderRadius: "12px",

              border: "none",

              background:
                "rgba(255,255,255,0.08)",

              color: "white",

              fontSize: "16px",

              outline: "none",
            }}
          />

          <button
            onClick={enviarMensagem}

            style={{
              background:
                "linear-gradient(90deg,#22c55e,#4ade80)",

              border: "none",

              padding: "18px 30px",

              borderRadius: "12px",

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
  );
}