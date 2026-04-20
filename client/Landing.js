import React from "react";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function Landing({ onEntrar }) {

  async function irParaPagamento() {
    try {
      const user_id = localStorage.getItem("user_id");

      if (!user_id) {
        alert("Faça login antes de virar Premium");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao gerar pagamento");
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com pagamento");
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(to right, #4facfe, #00f2fe)"
    }}>
      
      <div style={{
        background: "#fff",
        padding: 30,
        borderRadius: 10,
        width: 320,
        textAlign: "center"
      }}>

        <h1>NeuroMapa360</h1>

        <p>Transforme sua mente com IA</p>

        <button
          onClick={onEntrar}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 10,
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          🚀 Testar Grátis
        </button>

        <button
          onClick={irParaPagamento}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 10,
            background: "#ffc107",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          🔥 Virar Premium
        </button>

      </div>
    </div>
  );
}

export default Landing;
