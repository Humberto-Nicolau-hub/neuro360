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
  Deprimido:1,
  Desmotivado:2,
  Triste:3,
  Ansioso:4,
  Estressado:5,
  Procrastinador:6,
  Feliz:8
};

export default function App() {

const [session, setSession] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [modoCadastro, setModoCadastro] = useState(false);
const [loading, setLoading] = useState(false);

const [texto, setTexto] = useState("");
const [emocao, setEmocao] = useState("Ansioso");
const [resposta, setResposta] = useState("");
const [grafico, setGrafico] = useState([]);

const [plano, setPlano] = useState("free");
const [isAdmin, setIsAdmin] = useState(false);
const [interacoes, setInteracoes] = useState(0);

/* NOVO */
const [metricas, setMetricas] = useState(null);
const [modoIA, setModoIA] = useState("normal"); // normal | terapeutico

const isPremium = plano === "premium" || isAdmin;

/* ================= AUTH ================= */
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_, session) => setSession(session)
  );

  return () => listener?.subscription?.unsubscribe();
}, []);

/* RESET DIÁRIO */
useEffect(() => {
  const hoje = new Date().toDateString();
  const ultimo = localStorage.getItem("ultimoUso");

  if (ultimo !== hoje) {
    localStorage.setItem("ultimoUso", hoje);
    localStorage.setItem("interacoes", "0");
    setInteracoes(0);
  } else {
    setInteracoes(parseInt(localStorage.getItem("interacoes") || "0"));
  }
}, []);

/* ================= USER ================= */
useEffect(() => {
  if (session?.user) {
    buscarUsuario();
    buscarRegistros();
    if (isAdmin) carregarMetricas();
  }
}, [session, isAdmin]);

const buscarUsuario = async () => {
  const emailUser = session.user.email;

  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", emailUser)
    .single();

  const admin = emailUser === ADMIN_EMAIL;

  if (!data) {
    const { data: novo } = await supabase
      .from("profiles")
      .insert([{ email: emailUser, plano: admin ? "premium":"free", is_admin: admin }])
      .select()
      .single();

    data = novo;
  }

  setPlano(admin ? "premium" : data?.plano || "free");
  setIsAdmin(admin || data?.is_admin || false);
};

/* ================= REGISTROS ================= */
const buscarRegistros = async () => {
  const { data } = await supabase
    .from("registros_emocionais")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  setGrafico(
    data?.map(d => ({
      data: new Date(d.created_at).toLocaleDateString(),
      valor: MAPA[d.emocao] || 5
    })) || []
  );
};

/* ================= ADMIN ================= */
const carregarMetricas = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/admin-metricas`);
    const data = await res.json();
    setMetricas(data);
  } catch {
    console.log("Erro métricas");
  }
};

/* ================= LOGIN ================= */
const login = async () => {
  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.log(error.message);
    alert("Login inválido");
  }

  setLoading(false);
};

const cadastrar = async () => {
  setLoading(true);

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) alert(error.message);
  else {
    alert("Conta criada!");
    setModoCadastro(false);
  }

  setLoading(false);
};

/* ================= IA ================= */
const falarComIA = async () => {

  if (!texto) return alert("Descreva como você está.");

  if (!isPremium && interacoes >= MAX_FREE_INTERACOES) {
    alert("Limite diário atingido 🚀");
    return;
  }

  setLoading(true);

  const res = await fetch(`${BACKEND_URL}/ia`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      texto,
      emocao,
      user_id: session.user.id,
      modo: modoIA // 🔥 NOVO
    })
  });

  const data = await res.json();

  setResposta(data.resposta);

  const novo = interacoes + 1;
  setInteracoes(novo);
  localStorage.setItem("interacoes", novo.toString());

  await supabase.from("registros_emocionais").insert([{
    user_id: session.user.id,
    emocao,
    texto
  }]);

  buscarRegistros();
  setLoading(false);
};

const logout = async () => {
  await supabase.auth.signOut();
  window.location.reload();
};

/* ================= LOGIN UI ================= */
if (!session) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h2>NeuroMapa360</h2>

        <input style={styles.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={styles.input} type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/>

        <button style={styles.button} onClick={modoCadastro ? cadastrar : login}>
          {loading ? "Processando..." : modoCadastro ? "Criar Conta" : "Entrar"}
        </button>

        <p style={styles.link} onClick={()=>setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tem conta? Login" : "Criar conta"}
        </p>
      </div>
    </div>
  );
}

/* ================= APP ================= */
return (
  <div style={styles.app}>

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>

      <p style={{color:"#22c55e"}}>
        Plano: {isPremium ? "Premium ✅" : "Free"}
      </p>

      {isAdmin && <p style={{color:"#facc15"}}>ADMIN 👑</p>}

      {/* 🔥 NOVO MODO */}
      {isPremium && (
        <select
          style={styles.input}
          value={modoIA}
          onChange={(e)=>setModoIA(e.target.value)}
        >
          <option value="normal">Modo Insight</option>
          <option value="terapeutico">Modo Terapêutico</option>
        </select>
      )}

      <button style={styles.logout} onClick={logout}>Sair</button>
    </div>

    <div style={styles.main}>
      <h1>Dashboard Emocional</h1>

      <div style={styles.card}>
        <select style={styles.input} value={emocao} onChange={(e)=>setEmocao(e.target.value)}>
          {EMOCOES.map(e => <option key={e}>{e}</option>)}
        </select>

        <input
          style={styles.input}
          placeholder="Como você está?"
          value={texto}
          onChange={(e)=>setTexto(e.target.value)}
        />

        <button style={styles.button} onClick={falarComIA}>
          {loading ? "Pensando..." : "Falar com IA"}
        </button>
      </div>

      {resposta && (
        <div style={styles.card}>
          <h3>{modoIA === "terapeutico" ? "Sessão Terapêutica" : "Insight da IA"}</h3>
          <p>{resposta}</p>
        </div>
      )}

      {grafico.length > 0 && (
        <div style={styles.card}>
          <EvolucaoChart data={grafico}/>
        </div>
      )}

      {isAdmin && metricas && (
        <div style={styles.card}>
          <h3>📊 Painel Admin</h3>
          <p>Usuários: {metricas.totalUsuarios}</p>
          <p>Registros: {metricas.totalRegistros}</p>
          <p>IA: {metricas.totalIA}</p>
        </div>
      )}
    </div>
  </div>
);
}

/* ================= ESTILO ================= */
const styles = {
  app:{display:"flex",height:"100vh",background:"linear-gradient(135deg,#0f172a,#1e293b)",color:"#fff"},
  sidebar:{width:250,background:"#020617",padding:20,display:"flex",flexDirection:"column",gap:10},
  main:{flex:1,padding:30,overflowY:"auto"},
  card:{background:"#1e293b",padding:20,borderRadius:12,marginBottom:20},
  input:{width:"100%",padding:12,marginTop:10,borderRadius:8,border:"none",background:"#334155",color:"#fff"},
  button:{marginTop:15,padding:12,width:"100%",borderRadius:8,border:"none",background:"#22c55e",color:"#fff"},
  logout:{marginTop:"auto",background:"#ef4444",padding:10,borderRadius:6,color:"#fff",border:"none"},
  loginContainer:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center",background:"linear-gradient(135deg,#0f172a,#1e293b)"},
  loginCard:{background:"#1e293b",padding:40,borderRadius:12,display:"flex",flexDirection:"column",gap:10,width:300},
  link:{marginTop:10,cursor:"pointer",color:"#38bdf8"}
};
