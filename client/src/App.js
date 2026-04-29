import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";
const ADMIN_EMAIL = "contatobetaofertas@gmail.com";
const MAX_FREE_INTERACOES = 3;

const EMOCOES = ["Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido","Procrastinador"];

const MAPA = {"Deprimido":1,"Desmotivado":2,"Triste":3,"Ansioso":4,"Estressado":5,"Procrastinador":6,"Feliz":8};

const PremiumModal = ({ onClose, onUpgrade }) => {
  return (
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
        <button style={{marginTop:10}} onClick={onClose}>Continuar grátis</button>
      </div>
    </div>
  );
};

const PremiumOverlay = ({ onUpgrade }) => {
  return (
    <div style={{
      position:"absolute",
      inset:0,
      background:"rgba(0,0,0,0.8)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center"
    }}>
      <button onClick={onUpgrade}>🔒 Desbloquear</button>
    </div>
  );
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

const [showModal, setShowModal] = useState(false);

const isPremium = plano === "premium" || isAdmin;

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_, session) => setSession(session)
  );

  return () => listener?.subscription?.unsubscribe();
}, []);

useEffect(() => {
  if (session?.user) {
    setInteracoes(0);
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
    alert(error.message);
  } else {
    alert("Conta criada!");
    setModoCadastro(false);
  }

  setLoading(false);
};

const irParaCheckout = async () => {
  const res = await fetch(`${BACKEND_URL}/create-checkout`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
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
  setInteracoes(prev => prev + 1);

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

if (!session) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h1>NeuroMapa360</h1>

        <input style={styles.input} placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Senha" onChange={(e)=>setPassword(e.target.value)} />

        <button style={styles.button} onClick={modoCadastro ? cadastrar : login}>
          {loading ? "Processando..." : modoCadastro ? "Criar Conta" : "Entrar"}
        </button>

        <p style={{cursor:"pointer"}} onClick={()=>setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tem conta? Login" : "Criar conta"}
        </p>
      </div>
    </div>
  );
}

return (
  <div style={styles.app}>

    {showModal && (
      <PremiumModal
        onClose={()=>setShowModal(false)}
        onUpgrade={irParaCheckout}
      />
    )}

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>
      <span>Plano: {isPremium ? "Premium" : "Free"}</span>

      {!isPremium && (
        <button style={styles.upgrade} onClick={irParaCheckout}>
          Upgrade 🚀
        </button>
      )}

      {isAdmin && <span>ADMIN 👑</span>}

      <button style={styles.logout} onClick={logout}>Sair</button>
    </div>

    <div style={styles.main}>
      <h1>Dashboard Emocional</h1>

      <input style={styles.input} placeholder="Como você está?" value={texto} onChange={(e)=>setTexto(e.target.value)} />

      <button style={styles.button} onClick={falarComIA}>
        {loading ? "Pensando..." : "Falar com IA"}
      </button>

      {resposta && <p>{resposta}</p>}

      <EvolucaoChart data={grafico} />

    </div>
  </div>
);
}

const styles = {
  app:{display:"flex",height:"100vh",background:"#0f172a",color:"#fff"},
  sidebar:{width:220,background:"#020617",padding:20},
  main:{flex:1,padding:30},
  input:{width:"100%",padding:10,marginTop:10},
  button:{marginTop:10,padding:10,width:"100%"},
  upgrade:{marginTop:10},
  logout:{marginTop:20},
  loginContainer:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"},
  loginCard:{background:"#1e293b",padding:40}
};
