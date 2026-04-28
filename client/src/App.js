import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

// 🔐 SUPABASE
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

// 🔥 CONFIG
const BACKEND_URL = "https://neuro360-tkyx.onrender.com";
const ADMIN_EMAIL = "contatobetaofertas@gmail.com";

const EMOCOES = [
  "Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido","Procrastinador"
];

const MAPA = {
  "Deprimido":1,"Desmotivado":2,"Triste":3,"Ansioso":4,"Estressado":5,"Procrastinador":6,"Feliz":8
};

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

  // 🔐 SESSION
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // 🔥 SINCRONIZA PLANO SEMPRE
  useEffect(() => {
    if (session?.user?.email) {
      buscarOuCriarUsuario();
      buscarRegistros();
    }
  }, [session]);

  const buscarOuCriarUsuario = async () => {
    const userEmail = session.user.email;

    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (!data) {
      const isAdminUser = userEmail === ADMIN_EMAIL;

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

    setPlano(data?.plano || "free");
    setIsAdmin(data?.is_admin || false);
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

  // 🔐 LOGIN
  const login = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) alert("Login inválido ❌");

    setLoading(false);
  };

  // 🆕 CADASTRO
  const cadastrar = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      if (error.message.includes("already")) {
        alert("Email já existe. Faça login.");
      } else {
        alert(error.message);
      }
    } else {
      alert("Conta criada! Verifique seu email 📩");
      setModoCadastro(false);
    }

    setLoading(false);
  };

  // 💳 CHECKOUT
  const irParaCheckout = async () => {
    try {
      setLoadingCheckout(true);

      const res = await fetch(`${BACKEND_URL}/create-checkout`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email
        })
      });

      const data = await res.json();

      if (data.url) window.location.href = data.url;
      else alert("Erro ao iniciar pagamento");

    } catch {
      alert("Erro no checkout");
    }

    setLoadingCheckout(false);
  };

  // 💳 PORTAL (NOVO)
  const gerenciarAssinatura = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/create-portal`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          email: session.user.email
        })
      });

      const data = await res.json();

      if (data.url) window.location.href = data.url;
      else alert("Erro ao abrir portal");

    } catch {
      alert("Erro no portal");
    }
  };

  // 🤖 IA
  const falarComIA = async () => {
    if (!texto) return alert("Descreva algo");

    if (plano === "free" && interacoes >= 3) {
      return alert("Limite free atingido 🚀");
    }

    setLoading(true);

    try {
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

      setResposta(data.resposta);
      setInteracoes(prev => prev + 1);

      await supabase.from("registros_emocionais").insert([{
        user_id: session.user.id,
        emocao,
        texto
      }]);

      buscarRegistros();

    } catch {
      alert("Erro na IA");
    }

    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // 🔐 LOGIN SCREEN
  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1>NeuroMapa360</h1>

          <input style={styles.input} placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Senha" value={password} onChange={(e)=>setPassword(e.target.value)} />

          <button style={styles.button} onClick={modoCadastro ? cadastrar : login}>
            {loading ? "Processando..." : modoCadastro ? "Criar Conta" : "Entrar"}
          </button>

          <p style={{ marginTop: 10, cursor: "pointer", color: "#38bdf8" }}
             onClick={() => setModoCadastro(!modoCadastro)}>
            {modoCadastro ? "Já tem conta? Login" : "Não tem conta? Criar conta"}
          </p>
        </div>
      </div>
    );
  }

  // 🚀 APP
  return (
    <div style={styles.app}>

      <div style={styles.sidebar}>
        <h2>Neuro360</h2>

        <button style={styles.menuItem}>Dashboard</button>
        <button style={styles.menuItem}>Relatórios</button>

        <div style={{ marginTop: 10 }}>
          <span style={{ color: plano === "premium" ? "#22c55e" : "#94a3b8" }}>
            Plano: {plano === "premium" ? "Premium ✅" : "Free"}
          </span>
        </div>

        {/* 🔥 BOTÃO INTELIGENTE */}
        {plano === "free" ? (
          <button
            style={{ background:"#22c55e", padding:10, borderRadius:6, marginTop:10 }}
            onClick={irParaCheckout}
          >
            {loadingCheckout ? "Redirecionando..." : "Upgrade para Premium 🚀"}
          </button>
        ) : (
          <button
            style={{ background:"#3b82f6", padding:10, borderRadius:6, marginTop:10 }}
            onClick={gerenciarAssinatura}
          >
            Gerenciar Assinatura ⚙️
          </button>
        )}

        {isAdmin && <span style={{ color: "#facc15" }}>ADMIN 👑</span>}

        <button style={styles.logout} onClick={logout}>Sair</button>
      </div>

      <div style={styles.main}>
        <h1>Dashboard Emocional</h1>

        <div style={styles.card}>
          <select style={styles.input} value={emocao} onChange={(e)=>setEmocao(e.target.value)}>
            {EMOCOES.map(e => <option key={e}>{e}</option>)}
          </select>

          <input style={styles.input} placeholder="Como você está?" value={texto} onChange={(e)=>setTexto(e.target.value)} />

          <button style={styles.button} onClick={falarComIA}>
            {loading ? "Pensando..." : "Falar com IA"}
          </button>
        </div>

        {resposta && (
          <div style={styles.card}>
            <h3>Insight da IA</h3>
            <p>{resposta}</p>
          </div>
        )}

        {grafico.length > 0 && (
          <div style={styles.card}>
            <EvolucaoChart data={grafico} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: { display:"flex", height:"100vh", background:"#0f172a", color:"#fff"},
  sidebar:{ width:220, background:"#020617", padding:20, display:"flex", flexDirection:"column", gap:10},
  main:{ flex:1, padding:30, overflowY:"auto"},
  card:{ background:"#1e293b", padding:20, borderRadius:12, marginBottom:20},
  input:{ width:"100%", padding:12, marginTop:10, borderRadius:8, border:"none", background:"#334155", color:"#fff"},
  button:{ marginTop:15, padding:12, width:"100%", borderRadius:8, border:"none", background:"#3b82f6", color:"#fff"},
  menuItem:{ background:"none", border:"none", color:"#94a3b8", textAlign:"left", padding:8},
  logout:{ marginTop:"auto", background:"#ef4444", color:"#fff", border:"none", padding:10, borderRadius:6},
  loginContainer:{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"#0f172a"},
  loginCard:{ background:"#1e293b", padding:40, borderRadius:12}
};
