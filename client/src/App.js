import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

// ✅ CORREÇÃO CRÍTICA
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";

const MAX_FREE_INTERACOES = 3;

export default function App() {

  const [session, setSession] = useState(null);

  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");

  const [plano, setPlano] = useState("free");
  const [isAdmin, setIsAdmin] = useState(false);

  const [interacoes, setInteracoes] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const isPremium = plano === "premium" || isAdmin;

  // =========================
  // 🔐 AUTH
  // =========================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // =========================
  // 🔥 CARREGAR PERFIL CORRETO
  // =========================
  useEffect(() => {
    if (!session?.user) return;

    carregarPerfil();

  }, [session]);

  const carregarPerfil = async () => {

    const userEmail = session.user.email;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .single();

    const isAdminUser = userEmail === ADMIN_EMAIL;

    console.log("🔥 PERFIL:", data);

    setPlano(isAdminUser ? "premium" : data?.plano || "free");
    setIsAdmin(isAdminUser || data?.is_admin || false);

  };

  // =========================
  // 🚀 CHECKOUT
  // =========================
  const irParaCheckout = async () => {
    const res = await fetch(`${BACKEND_URL}/create-checkout`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        user_id: session.user.id,
        email: session.user.email
      })
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // =========================
  // 🤖 IA
  // =========================
  const falarComIA = async () => {

    if (!texto) return alert("Digite algo");

    // 🆓 CONTROLE FREE (CORRETO)
    if (!isPremium && interacoes >= MAX_FREE_INTERACOES) {
      setShowModal(true);
      return;
    }

    const res = await fetch(`${BACKEND_URL}/ia`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session.user.id
      })
    });

    const data = await res.json();

    if (data.error) {
      console.log("⚠️ BACKEND:", data.error);
      return;
    }

    setResposta(data.resposta);

    // 🔥 INCREMENTO CORRETO
    if (!isPremium) {
      setInteracoes(prev => prev + 1);
    }
  };

  // =========================
  // UI
  // =========================
  if (!session) return <div>Login...</div>;

  return (
    <div style={{ padding: 30, color: "#fff", background:"#0f172a", minHeight:"100vh" }}>

      {showModal && (
        <div style={{
          position:"fixed",
          inset:0,
          background:"rgba(0,0,0,0.8)",
          display:"flex",
          justifyContent:"center",
          alignItems:"center"
        }}>
          <div style={{ background:"#020617", padding:30 }}>
            <h2>🚀 Desbloqueie sua evolução</h2>
            <button onClick={irParaCheckout}>Virar Premium</button>
            <button onClick={()=>setShowModal(false)}>Continuar free</button>
          </div>
        </div>
      )}

      <h1>Dashboard Emocional</h1>

      <p>
        Plano: {isPremium ? "Premium ✅" : "Free"}
        {isAdmin && " 👑 ADMIN"}
      </p>

      <input
        placeholder="Como você está?"
        value={texto}
        onChange={(e)=>setTexto(e.target.value)}
      />

      <button onClick={falarComIA}>
        Falar com IA
      </button>

      <p>Interações usadas: {interacoes}/{MAX_FREE_INTERACOES}</p>

      {resposta && <p>{resposta}</p>}

    </div>
  );
}
