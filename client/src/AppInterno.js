import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function AppInterno() {
  const [user, setUser] = useState(null);
  const [plano, setPlano] = useState("free");
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      localStorage.setItem("user_id", user.id);

      try {
        const res = await fetch(`${BACKEND_URL}/plano/${user.id}`);
        const data = await res.json();
        setPlano(data.plano);
      } catch {
        setPlano("free");
      }
    }
  }

  async function falarComIA() {
    if (!texto) return;

    const res = await fetch(`${BACKEND_URL}/ia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texto,
        user_id: user.id,
      }),
    });

    const data = await res.json();
    setResposta(data.resposta);

    // 🔥 volta pro topo automaticamente
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function logout() {
    await supabase.auth.signOut();

    // 🔥 limpa TUDO
    localStorage.clear();

    // 🔥 força reset completo
    window.location.reload();
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: 20
    }}>

      <div style={{
        background: "#fff",
        padding: 30,
        borderRadius: 10,
        width: 320,
        textAlign: "center"
      }}>

        <h1>NeuroMapa360</h1>

        <p><strong>Plano:</strong> {plano.toUpperCase()}</p>

        <button
          onClick={logout}
          style={{
            background: "red",
            color: "#fff",
            border: "none",
            padding: 5,
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          Sair
        </button>

        <br /><br />

        <select style={{ width: "100%", padding: 8 }}>
          <option>Ansioso</option>
          <option>Triste</option>
          <option>Estressado</option>
        </select>

        <br /><br />

        <textarea
          placeholder="Descreva como você está"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={{
            width: "100%",
            height: 80
          }}
        />

        <br /><br />

        <button
          onClick={falarComIA}
          style={{
            width: "100%",
            padding: 10,
            background: "green",
            color: "#fff",
            border: "none",
            borderRadius: 5
          }}
        >
          Falar com IA
        </button>

        <br /><br />

        {resposta && (
          <div>
            <h3>Resposta da IA</h3>
            <p style={{ textAlign: "left" }}>{resposta}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default AppInterno;
