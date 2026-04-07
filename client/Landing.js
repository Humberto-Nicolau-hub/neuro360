import React from "react";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function Landing() {

  async function irParaPagamento() {
    const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "cliente@teste.com"
      }),
    });

    const data = await res.json();

    window.location.href = data.url;
  }

  return (
    <div style={{
      fontFamily: "Arial",
      padding: "40px",
      textAlign: "center",
      background: "#0f172a",
      color: "white",
      minHeight: "100vh"
    }}>
      
      <h1 style={{ fontSize: "40px" }}>
        🧠 Transforme sua mente. Reprograme sua vida.
      </h1>

      <p style={{ fontSize: "18px", marginTop: "20px" }}>
        Um sistema inteligente baseado em PNL + IA que ajuda você a vencer ansiedade,
        reprogramar crenças e evoluir emocionalmente todos os dias.
      </p>

      <button
        onClick={irParaPagamento}
        style={{
          marginTop: "30px",
          padding: "15px 30px",
          fontSize: "18px",
          background: "#22c55e",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        💎 Quero desbloquear minha evolução
      </button>

      <div style={{ marginTop: "60px" }}>
        <h2>🚀 O que você vai receber:</h2>

        <ul style={{ listStyle: "none", marginTop: "20px" }}>
          <li>✔ IA terapêutica personalizada</li>
          <li>✔ Controle emocional diário</li>
          <li>✔ Quebra de crenças limitantes</li>
          <li>✔ Evolução com base em dados reais</li>
          <li>✔ Acesso premium completo</li>
        </ul>
      </div>

      <div style={{ marginTop: "60px" }}>
        <h2>💡 Para quem é:</h2>

        <p>
          Pessoas que querem sair da ansiedade, destravar a mente e evoluir com direção.
        </p>
      </div>

      <div style={{ marginTop: "60px" }}>
        <h2>🔥 Oferta especial</h2>

        <p style={{ fontSize: "22px", marginTop: "10px" }}>
          Apenas R$19,90
        </p>

        <button
          onClick={irParaPagamento}
          style={{
            marginTop: "20px",
            padding: "15px 30px",
            fontSize: "18px",
            background: "#22c55e",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Começar agora
        </button>
      </div>

    </div>
  );
}

export default Landing;
