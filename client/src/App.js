import React, { useEffect, useRef, useState } from "react";
import AdminDashboard from "./AdminDashboard";

const API_URL = "https://backend-neuro360.onrender.com";

export default function App() {
  const [mensagem, setMensagem] = useState("");
  const [chat, setChat] = useState([]);
  const [emocao, setEmocao] = useState("ansioso");
  const [modoTerapeutico, setModoTerapeutico] = useState(true);
  const [loading, setLoading] = useState(false);
  const [grafico, setGrafico] = useState([]);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);

  const mensagensRef = useRef(null);

  const userIdRef = useRef(
    localStorage.getItem("neuro_user_id") ||
      crypto.randomUUID()
  );

  useEffect(() => {
    localStorage.setItem(
      "neuro_user_id",
      userIdRef.current
    );
  }, []);

  useEffect(() => {
    mensagensRef.current?.scrollTo({
      top: mensagensRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  async function enviarMensagem() {
    if (!mensagem.trim()) return;

    const mensagemUsuario = mensagem;

    setChat((prev) => [
      ...prev,
      {
        tipo: "usuario",
        texto: mensagemUsuario,
      },
    ]);

    setMensagem("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userIdRef.current,
            mensagem: mensagemUsuario,
            emocao,
            terapeutico: modoTerapeutico,
          }),
        }
      );

      const data = await response.json();

      setChat((prev) => [
        ...prev,
        {
          tipo: "ia",
          texto: data.resposta,
          hawkins:
            data.frequencia_hawkins || null,
          nivel:
            data.nivel_consciencia || null,
        },
      ]);

      setGrafico((prev) => [
        ...prev,
        {
          intensidade:
            data.intensidade || 5,
        },
      ]);
    } catch (err) {
      console.error(err);

      setChat((prev) => [
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

  if (mostrarAdmin) {
    return (
      <AdminDashboard
        voltar={() =>
          setMostrarAdmin(false)
        }
      />
    );
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <h1 style={styles.logo}>
          Neuro360
        </h1>

        <p style={styles.premium}>
          Plano: Premium ✅
        </p>

        <button
          style={styles.admin}
          onClick={() =>
            setMostrarAdmin(true)
          }
        >
          ADMIN 👑
        </button>

        <div style={styles.box}>
          <strong>
            Terapia Guiada
          </strong>

          <button
            style={{
              ...styles.toggle,
              background: modoTerapeutico
                ? "#22c55e"
                : "#334155",
            }}
            onClick={() =>
              setModoTerapeutico(
                !modoTerapeutico
              )
            }
          >
            {modoTerapeutico
              ? "ON"
              : "OFF"}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div
          style={styles.chat}
          ref={mensagensRef}
        >
          {chat.map((msg, i) => (
            <div
              key={i}
              style={
                msg.tipo === "usuario"
                  ? styles.userBubble
                  : styles.aiBubble
              }
            >
              <p>{msg.texto}</p>

              {msg.hawkins && (
                <div
                  style={
                    styles.hawkins
                  }
                >
                  🔥 Hawkins:
                  {" "}
                  {msg.hawkins}
                  {" "}
                  Hz
                  <br />
                  🧠 Nível:
                  {" "}
                  {msg.nivel}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={styles.aiBubble}>
              IA analisando emoções...
            </div>
          )}
        </div>

        <div style={styles.controls}>
          <select
            value={emocao}
            onChange={(e) =>
              setEmocao(e.target.value)
            }
            style={styles.select}
          >
            <option value="ansioso">
              Ansioso
            </option>

            <option value="triste">
              Triste
            </option>

            <option value="desmotivado">
              Desmotivado
            </option>

            <option value="feliz">
              Feliz
            </option>
          </select>

          <input
            style={styles.input}
            value={mensagem}
            onChange={(e) =>
              setMensagem(e.target.value)
            }
            placeholder="Como você está se sentindo?"
          />

          <button
            style={styles.send}
            onClick={enviarMensagem}
          >
            Enviar
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  app: {
    display: "flex",
    background: "#020617",
    color: "#fff",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Arial",
  },

  sidebar: {
    width: 260,
    background: "#0f172a",
    padding: 20,
    borderRight:
      "1px solid #1e293b",
  },

  logo: {
    fontSize: 36,
  },

  premium: {
    color: "#4ade80",
  },

  admin: {
    marginTop: 20,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    cursor: "pointer",
  },

  box: {
    marginTop: 30,
  },

  toggle: {
    marginTop: 10,
    padding: 12,
    width: "100%",
    border: "none",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 30,
  },

  userBubble: {
    background: "#22c55e",
    marginBottom: 20,
    padding: 18,
    borderRadius: 18,
    maxWidth: "60%",
    marginLeft: "auto",
  },

  aiBubble: {
    background: "#1e3a8a",
    marginBottom: 20,
    padding: 18,
    borderRadius: 18,
    maxWidth: "70%",
  },

  hawkins: {
    marginTop: 15,
    background: "#0f172a",
    padding: 10,
    borderRadius: 10,
    fontSize: 14,
    color: "#4ade80",
  },

  controls: {
    display: "flex",
    gap: 10,
    padding: 20,
    borderTop:
      "1px solid #1e293b",
  },

  input: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    border: "none",
  },

  select: {
    padding: 14,
    borderRadius: 10,
  },

  send: {
    padding: "14px 24px",
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "#fff",
    cursor: "pointer",
  },
};
