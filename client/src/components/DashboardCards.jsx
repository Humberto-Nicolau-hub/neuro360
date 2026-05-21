export default function DashboardCards({

estadoAtual

}){

return(

<div style={styles.topCards}>

<div style={styles.card}>

<h3>Score</h3>

<h1 style={{
fontSize:36,
marginTop:5
}}>
{estadoAtual.score}
</h1>

</div>


<div style={styles.card}>

<h3>Hawkins</h3>

<h1 style={{
fontSize:36,
marginTop:5
}}>
{estadoAtual.hawkins}
</h1>

</div>


<div style={styles.card}>

<h3>Estado</h3>

<h1 style={{
fontSize:36,
marginTop:5
}}>
{estadoAtual.emocao}
</h1>

</div>

</div>

);

}

const styles={

topCards:{
display:"grid",
gridTemplateColumns:
"repeat(3,minmax(150px,1fr))",
gap:12
},

card:{
flex:1,
background:
"linear-gradient(180deg,#0b1120,#111827)",
padding:6,
minHeight:60,
borderRadius:18,
border:"1px solid #1e293b",
boxShadow:
"0 0 30px rgba(34,211,238,0.08)"
}

};