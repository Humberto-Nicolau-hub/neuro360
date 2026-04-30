import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";
const MAX_FREE_INTERACOES = 3;

const EMOCOES = ["Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido","Procrastinador"];

const MAPA = {
  "Deprimido":1,
  "Desmotivado":2,
  "Triste":3,
  "Ansioso":4,
  "Estressado":5,
  "Procrastinador":6,
  "Feliz":8
};

const PremiumModal = ({ onClose, onUpgrade }) => (
  <div style={{
    position:"fixed",
    inset:0,
    background:"rgba(0,0,0,0.85)",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    zIndex:999
  }}>
    <div style={{background:"#020617", padding:30, borderRadius:12}}>
      <h2>🚀 Desbloqueie sua evolução</h2>
      <button style={{marginTop:10}} onClick={onUpgrade}>Upgrade</button>
      <button style={{marginTop:10}} onClick={onClose}>Continuar no gratuito</button>
    </div>
  </div>
);

export default function App() {

const [session, setSession] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [modoCadastro, setModoCadastro] = useState(false);
const [loading, setLoading] = useState(false);
const [loadingCheckout, setLoadingCheckout] = useState(false);

const [texto, setTexto] = useState("");
const [emocao, setEmocao] = useState("Ansioso");
const [resposta, setResposta] = useState("");
const [grafico, setGrafico] = useState([]);

const [plano, setPlano] = useState("free");
const [isAdmin, setIsAdmin] = useState(false);
const [interacoes, setInteracoes] = useState(0);

const [showModal, setShowModal] = useState(false);

/* =========================
   📊 NOVO: METRICS STATE
========================= */
const [metrics, setMetrics] = useState(null);

const isPremium = plano === "premium" || isAdmin;

/* =========================
   📊 NOVO: BUSCAR MÉTRICAS
========================= */
const carregarMetrics = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/admin-metrics`);
    const data = await res.json();
    setMetrics(data);
  } catch (e) {
    console.error("Erro ao carregar métricas");
  }
};

// AUTH
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_, session) => setSession(session)
  );

  return () => listener?.subscription?.unsubscribe();
}, []);

// 🔥 CONTROLE DIÁRIO
useEffect(() => {
  const hoje = new Date().toDateString();
  const ultimoUso = localStorage.getItem("ultimoUso");

  if (ultimoUso !== hoje) {
    localStorage.setItem("ultimoUso", hoje);
    localStorage.setItem("interacoes", "0");
    setInteracoes(0);
  } else {
    const salvas = parseInt(localStorage.getItem("interacoes") || "0");
    setInteracoes(salvas);
  }
}, []);

// LOAD USER
useEffect(() => {
  if (session?.user) {
    buscarOuCriarUsuario();
    buscarRegistros();
  }
}, [session]);

/* =========================
   📊 CARREGAR METRICS (ADMIN)
========================= */
useEffect(() => {
  if (isAdmin) {
    carregarMetrics();
  }
}, [isAdmin]);

const buscarOuCriarUsuario = async () => {
  const userEmail = session.user.email;

  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", userEmail)
    .single();

  const isAdminUser = userEmail === ADMIN_EMAIL;

  if (!data) {
    const { data: novo } = await supabase
      .from("profiles")
      .insert([{
        email: userEmail,
        plano: isAdminUser ? "premium" : "free",
        is_admin: isAdminUser
      }])
      .select()
      .single();

    data = novo;
  }

  setPlano(isAdminUser ? "premium" : data?.plano || "free");
  setIsAdmin(isAdminUser || data?.is_admin || false);
};

const buscarRegistros = async () => {
  if (!session?.user?.id) return;

  const { data } = await supabase
    .from("registros_emocionais")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  const formatado = data?.map(d => ({
    data: new Date(d.created_at).toLocaleDateString(),
    valor: MAPA[d.emocao] || 5
  })) || [];

  setGrafico(formatado);
};

const login = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert("Login inválido ❌");
  setLoading(false);
};

const cadastrar = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already")) {
      alert("Email já existe. Faça login.");
    } else {
      alert(error.message);
    }
  } else {
    alert("Conta criada!");
    setModoCadastro(false);
  }

  setLoading(false);
};

const irParaCheckout = async () => {
  const res = await fetch(`${BACKEND_URL}/create-checkout`, {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      user_id: session.user.id,
      email: session.user.email
    })
  });

  const data = await res.json();
  window.location.href = data.url;
};

const falarComIA = async () => {

  if (!texto) return alert("Descreva como você está.");

  if (!isPremium && interacoes >= MAX_FREE_INTERACOES) {
    setShowModal(true);
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${BACKEND_URL}/ia`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session.user.id
      })
    });

    const data = await res.json();

    setResposta(data.resposta);

    setInteracoes(prev => {
      const novo = prev + 1;
      localStorage.setItem("interacoes", novo.toString());
      return novo;
    });

    await supabase.from("registros_emocionais").insert([{
      user_id: session.user.id,
      emocao,
      texto
    }]);

    buscarRegistros();

  } catch {
    alert("Erro ao falar com IA");
  }

  setLoading(false);
};

const logout = async () => {
  await supabase.auth.signOut();
  window.location.reload();
};

// LOGIN
if (!session) {
  return <div style={styles.loginContainer}><div style={styles.loginCard}>Login</div></div>;
}

// APP
return (
  <div style={styles.app}>

    {showModal && <PremiumModal onClose={()=>setShowModal(false)} onUpgrade={irParaCheckout}/>}

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>
      <span>Plano: {isPremium ? "Premium" : "Free"}</span>
      {isAdmin && <span>ADMIN 👑</span>}
      <button onClick={logout}>Sair</button>
    </div>

    <div style={styles.main}>
      <h1>Dashboard</h1>

      {/* 🔥 PAINEL ADMIN */}
      {isAdmin && metrics && (
        <div style={styles.card}>
          <h3>📊 Painel Admin</h3>
          <p>Usuários: {metrics.totalUsers}</p>
          <p>Free: {metrics.freeUsers}</p>
          <p>Premium: {metrics.premiumUsers}</p>
          <p>Uso hoje: {metrics.totalUsoHoje}</p>
          <p>Interações: {metrics.totalInteracoes}</p>
        </div>
      )}

      <div style={styles.card}>
        <button onClick={falarComIA}>Falar com IA</button>
      </div>

      {resposta && <div style={styles.card}>{resposta}</div>}

      {grafico.length > 0 && (
        <div style={styles.card}>
          <EvolucaoChart data={grafico}/>
        </div>
      )}
    </div>
  </div>
);
}

const styles = {
  app:{display:"flex"},
  sidebar:{width:200,background:"#111",padding:20},
  main:{flex:1,padding:20},
  card:{background:"#222",padding:20,marginBottom:10},
  loginContainer:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"},
  loginCard:{background:"#222",padding:20}
};
