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

const [metrics, setMetrics] = useState(null);

const isPremium = plano === "premium" || isAdmin;

/* ========================= AUTH ========================= */
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_, session) => setSession(session)
  );

  return () => listener?.subscription?.unsubscribe();
}, []);

/* ========================= RESET DIÁRIO ========================= */
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

/* ========================= USER ========================= */
useEffect(() => {
  if (session?.user) {
    buscarUsuario();
    buscarRegistros();
  }
}, [session]);

useEffect(() => {
  if (isAdmin) carregarMetrics();
}, [isAdmin]);

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

const carregarMetrics = async () => {
  const res = await fetch(`${BACKEND_URL}/admin-metrics`);
  const data = await res.json();
  setMetrics(data);
};

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

/* ========================= AUTH ACTIONS ========================= */
const login = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert("Login inválido");
  setLoading(false);
};

const cadastrar = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) alert(error.message);
  else {
    alert("Conta criada!");
    setModoCadastro(false);
  }

  setLoading(false);
};

/* ========================= IA ========================= */
const falarComIA = async () => {

  if (!texto) return alert("Descreva como você está.");

  if (!isPremium && interacoes >= MAX_FREE_INTERACOES) {
    alert("Limite diário atingido.");
    return;
  }

  setLoading(true);

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

/* ========================= LOGIN UI (CORRIGIDO) ========================= */
if (!session) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h2>Neuro360</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={modoCadastro ? cadastrar : login}>
          {loading ? "Processando..." : modoCadastro ? "Criar Conta" : "Entrar"}
        </button>

        <p onClick={() => setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tem conta? Login" : "Criar conta"}
        </p>
      </div>
    </div>
  );
}

/* ========================= APP ========================= */
return (
  <div style={styles.app}>

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>
      <p>{isPremium ? "Premium" : "Free"}</p>
      {isAdmin && <p>ADMIN 👑</p>}
      <button onClick={logout}>Sair</button>
    </div>

    <div style={styles.main}>
      <h1>Dashboard</h1>

      {isAdmin && metrics && (
        <div style={styles.card}>
          <p>Usuários: {metrics.totalUsers}</p>
          <p>Uso hoje: {metrics.totalUsoHoje}</p>
        </div>
      )}

      <div style={styles.card}>
        <textarea
          placeholder="Como você está hoje?"
          value={texto}
          onChange={e => setTexto(e.target.value)}
        />

        <button onClick={falarComIA}>
          {loading ? "Pensando..." : "Falar com IA"}
        </button>
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
  sidebar:{width:200,background:"#111",padding:20,color:"#fff"},
  main:{flex:1,padding:20},
  card:{background:"#222",padding:20,marginBottom:10,color:"#fff"},
  loginContainer:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"},
  loginCard:{background:"#222",padding:20,color:"#fff"}
};
