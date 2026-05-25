import React from "react";

const BACKEND_URL = "https://backend-neuro360.onrender.com";

function Landing({ onEntrar }) {

async function irParaPagamento(){

try{

const user_id=
localStorage.getItem("user_id");

if(!user_id){

alert(
"Faça login antes de virar Premium"
);

return;

}

const res=await fetch(

`${BACKEND_URL}/api/assinar-premium`,

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:JSON.stringify({

user_id

})

}

);

const data=
await res.json();

if(data.sucesso){

alert(
"Plano PREMIUM ativado!"
);

window.location.reload();

}else{

alert(
"Erro ao ativar plano"
);

}

}catch(err){

console.log(err);

alert(
"Erro de conexão"
);

}

}

return(

<div style={styles.container}>

<div style={styles.hero}>

<div style={styles.logo}/>

<h1 style={styles.title}>
NeuroMapa360
</h1>

<h2 style={styles.subtitle}>
Transforme emoções em evolução
com IA Terapêutica Adaptativa
</h2>

<p style={styles.text}>

Entenda padrões emocionais,
acompanhe sua evolução e receba
orientações personalizadas em tempo real.

</p>

<div style={styles.buttonArea}>

<button
onClick={onEntrar}
style={styles.buttonPrimary}
>
🚀 Começar grátis
</button>

<button
onClick={irParaPagamento}
style={styles.buttonPremium}
>
🔥 Virar Premium
</button>

</div>

</div>


<div style={styles.cardsArea}>

<div style={styles.card}>

<h3>
🧠 IA Terapêutica
</h3>

<p>

Conversa adaptativa e humana.

</p>

</div>

<div style={styles.card}>

<h3>
📊 Evolução emocional
</h3>

<p>

Acompanhe score e progresso.

</p>

</div>

<div style={styles.card}>

<h3>
🔥 Escala Hawkins
</h3>

<p>

Visualize níveis emocionais.

</p>

</div>

<div style={styles.card}>

<h3>
🛤️ Trilhas inteligentes
</h3>

<p>

Orientações personalizadas.

</p>

</div>

</div>


<div style={styles.planos}>

<h2>

Planos

</h2>

<div style={styles.planosGrid}>

<div style={styles.planoCard}>

<h3>
FREE
</h3>

<p>
✓ IA Terapêutica
</p>

<p>
✓ Histórico limitado
</p>

<p>
✓ Trilhas básicas
</p>

</div>


<div style={styles.premiumCard}>

<h3>
PREMIUM
</h3>

<p>
✓ Histórico completo
</p>

<p>
✓ Dashboard avançado
</p>

<p>
✓ Evolução personalizada
</p>

<p>
✓ Insights inteligentes
</p>

</div>

</div>

</div>


<div style={styles.cta}>

<h2>

Sua jornada emocional começa agora

</h2>

<button
onClick={onEntrar}
style={styles.buttonPrimary}
>

Criar conta gratuitamente

</button>

</div>

</div>

);

}

export default Landing;


const styles={

container:{

minHeight:"100vh",
background:
"linear-gradient(180deg,#020617,#0f172a)",

color:"white",
padding:40

},

hero:{

display:"flex",
flexDirection:"column",
alignItems:"center",
textAlign:"center",
marginBottom:70

},

logo:{

width:90,
height:90,
borderRadius:"50%",

background:
"linear-gradient(90deg,#22d3ee,#67e8f9)",

boxShadow:
"0 0 30px #22d3ee"

},

title:{

fontSize:55,
fontWeight:"bold"

},

subtitle:{

fontSize:30,
maxWidth:700

},

text:{

maxWidth:700,
opacity:.8,
lineHeight:1.7

},

buttonArea:{

display:"flex",
gap:20,
marginTop:30

},

buttonPrimary:{

padding:"14px 35px",
border:"none",
borderRadius:30,
cursor:"pointer",

background:
"linear-gradient(90deg,#22c55e,#4ade80)",

fontWeight:"bold"

},

buttonPremium:{

padding:"14px 35px",
border:"none",
borderRadius:30,
cursor:"pointer",

background:
"linear-gradient(90deg,#facc15,#f59e0b)",

fontWeight:"bold"

},

cardsArea:{

display:"grid",
gridTemplateColumns:
"repeat(auto-fit,minmax(250px,1fr))",

gap:20,
marginBottom:70

},

card:{

background:"#111827",
padding:25,
borderRadius:20,
border:"1px solid #1e293b"

},

planos:{

marginBottom:70,
textAlign:"center"

},

planosGrid:{

display:"flex",
gap:30,
justifyContent:"center",
flexWrap:"wrap"

},

planoCard:{

width:250,
padding:30,
background:"#111827",
borderRadius:20

},

premiumCard:{

width:250,
padding:30,

background:
"linear-gradient(180deg,#facc15,#f59e0b)",

color:"#111827",
borderRadius:20

},

cta:{

textAlign:"center"

}

};