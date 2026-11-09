// Dados simulados do protótipo. A integração com o backend será definida depois.
const mock = {
  historico: {
    cpu:[46,45,48,52,48,49,55,54,51,55,53,54,56,50,52,56,55,60,58,57,66,62,64,60,63,66,63,68,66,68],
    ram:[59,64,61,64,60,64,61,64,62,67,66,66,67,64,66,68,70,70,72,71,67,70,73,75,73,75,77,76,78,77],
    disco:[70,70,71,70,70,71,74,74,73,75,74,75,76,74,75,76,77,77,78,78,77,78,79,80,79,80,81,80,82,81]
  },
  previsao:{cpu:[70,72,74,76,80,81,82,83,84,85,86,87,88,89,90],ram:[77,78,78,79,79,80,80,81,81,82,82,83,83,84,85],disco:[81,81,82,82,82,83,83,84,84,84,85,85,85,86,86]},
  componentes:{cpu:{nome:'CPU',cor:'#20baf4',limite:80,atual:68,ritmo:2.4},ram:{nome:'Memória RAM',cor:'#ff9f32',limite:85,atual:77,ritmo:.6},disco:{nome:'Disco',cor:'#20d983',limite:90,atual:81,ritmo:.2}},
  runway:[{nome:'Processador (CPU)',dias:5,atual:68,limite:80,ritmo:'2,4 p.p./dia',cor:'#ff5c5c'},{nome:'Memória RAM',dias:14,atual:77,limite:85,ritmo:'0,6 p.p./dia',cor:'#f5c542'},{nome:'Disco (SSD)',dias:42,atual:81,limite:90,ritmo:'0,2 p.p./dia',cor:'#3ddc84'}],
  estresse:{acessos:[500,1000,1500,2000,2500,3000,3500,4000,4500,5000,5500,6000,6500,7000],cpu:[16,17,18,20,23,28,35,44,54,65,75,82,86,88],latenciaP95:[25,26,28,31,36,45,63,95,160,285,410,490,530,545],ruptura:5000},
  eventos:[
    ['HOJE (08/Nov)','Operação normal · SLA BCB 100% · Latência 28ms · Sem anomalias atípicas','#3ddc84'],
    ['D+3 (11/Nov)','[ ALERTA ] Pico 5º dia útil · Transbordo da fila Kafka · Auto-scale +4 vCPUs','#f5c542'],
    ['D+5 (13/Nov)','[ CRÍTICO ] Saturação CPU · Processador >85% SRV-PIX-01 · Upgrade de hardware imediato','#ff5c5c'],
    ['D+14 (22/Nov)','[ ALERTA ] Esgotamento RAM · DB-PROD-02 atingindo 80% · Purge & Buffer Recycle','#f5c542'],
    ['D+21 (29/Nov)','[ CRÍTICO ] Peak Black Friday · Spike de latência Gateway DICT · Ativar fallback assíncrono','#ff5c5c'],
    ['D+30 (08/Dez)','[ OK ] Janela de manutenção · Upgrade geral sem consumo do orçamento de indisponibilidade','#35b8f2']
  ]
};

function definirMensagemServidor(texto) {
  const mensagem=document.getElementById('mensagem-servidor');
  mensagem.textContent=texto;
}

function adicionarResumoServidor(rotulo,valor) {
  const item=document.createElement('span');
  const titulo=document.createElement('strong');
  titulo.textContent=`${rotulo}: `;
  item.append(titulo,document.createTextNode(valor || 'Não informado'));
  document.getElementById('servidor-resumo').appendChild(item);
}

function mostrarResumoServidor(servidor) {
  const resumo=document.getElementById('servidor-resumo');
  resumo.replaceChildren();
  adicionarResumoServidor('IP',servidor.ipEquipamento);
  adicionarResumoServidor('Status',servidor.statusEquipamento);
  adicionarResumoServidor('Localização',servidor.localizacao);
}

function carregarServidoresDaEmpresa() {
  const select=document.getElementById('servidor-em-analise');
  let usuario;
  try {
    usuario=JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
  } catch (erro) {
    localStorage.removeItem('usuarioLogado');
  }

  if(!usuario || !usuario.id || !usuario.idEmpresa){
    select.replaceChildren(new Option('Entre para carregar seus servidores',''));
    definirMensagemServidor('A prévia continua disponível sem login. Para consultar a lista da empresa,');
    const msg=document.getElementById('mensagem-servidor');
    const link=document.createElement('a');link.href='./login.html';link.textContent='entre no sistema.';msg.append(' ',link);
    return;
  }

  const url=`/hardwares/buscarEq/${encodeURIComponent(usuario.idEmpresa)}?idUsuario=${encodeURIComponent(usuario.id)}`;
  fetch(url,{cache:'no-store'})
    .then(resposta=>{
      if(resposta.status===204)return [];
      if(!resposta.ok){
        const erro=new Error(resposta.status===403?'Sem permissão para visualizar os servidores desta empresa.':`Não foi possível carregar os servidores (HTTP ${resposta.status}).`);
        erro.status=resposta.status;
        throw erro;
      }
      return resposta.json();
    })
    .then(linhas=>{
      const unicos=new Map();
      linhas.forEach(item=>{
        if(String(item.tipoEquipamento || '').toLocaleLowerCase('pt-BR')==='servidor' && !unicos.has(String(item.idEquipamento))){
          unicos.set(String(item.idEquipamento),item);
        }
      });
      const servidores=Array.from(unicos.values()).sort((a,b)=>String(a.nomeEquipamento).localeCompare(String(b.nomeEquipamento),'pt-BR'));
      select.replaceChildren(new Option('Selecione um servidor',''));
      if(servidores.length===0){
        select.replaceChildren(new Option('Nenhum servidor disponível',''));
        definirMensagemServidor('Nenhum servidor foi encontrado para esta empresa ou sua permissão não inclui servidores.');
        return;
      }
      servidores.forEach(servidor=>{
        const local=servidor.localizacao ? ` · ${servidor.localizacao}` : '';
        select.add(new Option(`${servidor.nomeEquipamento}${local}`,String(servidor.idEquipamento)));
      });
      select.disabled=false;
      definirMensagemServidor(`${servidores.length} servidor${servidores.length===1?'':'es'} disponível${servidores.length===1?'':'is'} na sua empresa.`);
      select.addEventListener('change',()=>{
        const urlAtual=new URL(window.location.href);
        const servidor=servidores.find(item=>String(item.idEquipamento)===select.value);
        if(!servidor){
          urlAtual.searchParams.delete('idEquipamento');
          window.history.replaceState({},'',urlAtual);
          document.getElementById('servidor-resumo').innerHTML='<span class="resumo-placeholder">Selecione um servidor para ver os dados de identificação.</span>';
          definirMensagemServidor(`${servidores.length} servidor${servidores.length===1?'':'es'} disponível${servidores.length===1?'':'is'} na sua empresa.`);
          return;
        }
        mostrarResumoServidor(servidor);
        urlAtual.searchParams.set('idEquipamento',select.value);
        window.history.replaceState({},'',urlAtual);
        definirMensagemServidor('Servidor selecionado. Os gráficos permanecem demonstrativos nesta etapa.');
      });
      const idDaUrl=new URLSearchParams(window.location.search).get('idEquipamento');
      const servidorDaUrl=servidores.find(item=>String(item.idEquipamento)===idDaUrl);
      if(servidorDaUrl){select.value=idDaUrl;mostrarResumoServidor(servidorDaUrl);definirMensagemServidor('Servidor recuperado da URL. Os gráficos permanecem demonstrativos nesta etapa.');}
    })
    .catch(erro=>{
      select.replaceChildren(new Option('Lista de servidores indisponível',''));
      definirMensagemServidor(erro.message || 'Erro ao consultar os servidores.');
    });
}

carregarServidoresDaEmpresa();

const eixoTexto = '#aaa8ba';
const eixoComum = {ticks:{color:eixoTexto,maxTicksLimit:8},grid:{color:'rgba(139,134,155,.12)'},border:{color:'#5c6288'}};
const diasEixo = Array.from({length:45},(_,i)=>i<29?`D-${29-i}`:i===29?'Hoje':`D+${i-29}`);
const corComFaixa = (cor,alpha=.14) => {
  const hex=cor.replace('#','');
  const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

let graficoTendencia;
function montarSerieFutura(valores, indice) {
  const inicio=Array(indice).fill(null);
  return [...inicio,valores[0],...valores.slice(1)];
}
function prepararTendencia(chave) {
  const item=mock.componentes[chave];
  const historico=[...mock.historico[chave],...Array(15).fill(null)];
  const projecao=[item.atual,...mock.previsao[chave]];
  const previsto=montarSerieFutura(projecao,29);
  const margem=projecao.map((_,i)=>i===0?0:2+Math.round((i-1)*.22));
  const faixaInferior=montarSerieFutura(projecao.map((v,i)=>Math.max(0,v-margem[i])),29);
  const faixaSuperior=montarSerieFutura(projecao.map((v,i)=>Math.min(100,v+margem[i])),29);
  const cruzamento=mock.previsao[chave].findIndex(v=>v>=item.limite);
  const cruzamentoTexto=cruzamento<0?'não previsto neste horizonte':`D+${cruzamento+1}`;
  document.getElementById('contexto-tendencia').innerHTML=`<span><b>${item.atual}%</b> agora</span><span>Limite: <b>${item.limite}%</b></span><span>Cruzamento estimado: <b>${cruzamentoTexto}</b></span>`;
  return {
    labels:diasEixo,
    datasets:[
      {label:'Uso observado',data:historico,borderColor:item.cor,borderWidth:2.3,pointRadius:0,pointHoverRadius:4,tension:.22,spanGaps:false},
      {label:`Limite (${item.limite}%)`,data:Array(45).fill(item.limite),borderColor:'#ff5c5c',borderWidth:1.5,borderDash:[5,5],pointRadius:0},
      {label:'Faixa provável',data:faixaInferior,borderColor:'transparent',pointRadius:0,fill:false},
      {label:'',data:faixaSuperior,borderColor:'transparent',pointRadius:0,fill:{target:'-1',above:corComFaixa(item.cor,.18)},legendOnly:true},
      {label:'Previsão central',data:previsto,borderColor:item.cor,borderWidth:2.2,borderDash:[7,5],pointRadius:0,pointHoverRadius:4,tension:.22,spanGaps:false}
    ]
  };
}
function atualizarTendencia(chave) {
  const data=prepararTendencia(chave);
  if(!graficoTendencia){
    graficoTendencia=new Chart(document.getElementById('grafico-tendencia'),{type:'line',data,options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#c5c3cd',boxWidth:14,filter:item=>item.text!=='Faixa provável'&&item.text!==''}},tooltip:{filter:c=>c.raw!==null,callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y}%`}}},scales:{x:{...eixoComum,title:{display:true,text:'Período em relação a hoje',color:eixoTexto},ticks:{...eixoComum.ticks,maxTicksLimit:10,callback:value=>value===29?'Hoje':value%5===0?diasEixo[value]:''}},y:{min:0,max:100,...eixoComum,title:{display:true,text:'Uso do recurso (%)',color:eixoTexto},ticks:{...eixoComum.ticks,callback:v=>`${v}%`}}}}});
  }else{graficoTendencia.data=data;graficoTendencia.update();}
}
document.querySelectorAll('[data-componente]').forEach(botao=>botao.addEventListener('click',()=>{
  document.querySelectorAll('[data-componente]').forEach(b=>{b.classList.toggle('ativo',b===botao);b.setAttribute('aria-pressed',String(b===botao));});
  atualizarTendencia(botao.dataset.componente);
}));
atualizarTendencia('cpu');

new Chart(document.getElementById('grafico-runway'),{type:'bar',data:{labels:mock.runway.map(x=>x.nome),datasets:[{data:mock.runway.map(x=>x.dias),backgroundColor:mock.runway.map(x=>x.cor),borderRadius:5,barThickness:19}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw} dias estimados até ${mock.runway[c.dataIndex].limite}%`}}},scales:{x:{min:0,max:45,ticks:{color:eixoTexto,callback:v=>`${v}d`},grid:{color:'rgba(139,134,155,.14)'},border:{color:'#5c6288'}},y:{ticks:{color:'#ddd9eb',font:{size:10}},grid:{display:false}}}}});
document.getElementById('runway-detalhes').innerHTML=mock.runway.map(x=>`<div class="runway-linha"><span class="runway-cor" style="--runway-cor:${x.cor}"></span><span><b>${x.atual}% agora</b> · limite ${x.limite}% · ritmo ${x.ritmo}</span></div>`).join('');

const marcadorRuptura={id:'marcadorRuptura',afterDatasetsDraw(chart,args,options){
  const index=mock.estresse.acessos.indexOf(mock.estresse.ruptura);if(index<0)return;
  const x=chart.scales.x.getPixelForValue(index),{ctx,chartArea}=chart;ctx.save();ctx.strokeStyle='#ff5c5c';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x,chartArea.top);ctx.lineTo(x,chartArea.bottom);ctx.stroke();ctx.restore();
}};
function criarGraficoEstresse(id,valores,limite,cor,formatar){
  return new Chart(document.getElementById(id),{type:'line',plugins:[marcadorRuptura],data:{labels:mock.estresse.acessos.map(v=>v.toLocaleString('pt-BR')),datasets:[{label:'Teste simulado',data:valores,borderColor:cor,backgroundColor:cor,borderWidth:2.2,pointRadius:2.5,pointHoverRadius:5,tension:.25},{label:`Referência (${formatar(limite)})`,data:Array(valores.length).fill(limite),borderColor:'#f5c542',borderDash:[4,4],borderWidth:1.3,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>`Hoje · ${mock.estresse.acessos[items[0].dataIndex].toLocaleString('pt-BR')} req/s`,label:c=>`${c.dataset.label}: ${formatar(c.parsed.y)}`}}},scales:{x:{...eixoComum,ticks:{...eixoComum.ticks,maxTicksLimit:7,callback:value=>`${mock.estresse.acessos[value].toLocaleString('pt-BR')} req/s`},title:{display:true,text:'Volume de requisições (req/s)',color:eixoTexto}},y:{beginAtZero:true,suggestedMax:valores===mock.estresse.cpu?100:600,...eixoComum,ticks:{...eixoComum.ticks,callback:v=>formatar(v)}}}}});
}
criarGraficoEstresse('grafico-estresse-cpu',mock.estresse.cpu,80,'#20baf4',v=>`${v}%`);
criarGraficoEstresse('grafico-estresse-latencia',mock.estresse.latenciaP95,300,'#ff9f32',v=>`${v} ms`);

document.getElementById('eventos').innerHTML=mock.eventos.map(([data,texto,cor])=>`<article class="evento" style="--evento-cor:${cor}"><span class="evento-data">${data}</span><span class="evento-ponto"></span><span class="evento-texto">${texto}</span></article>`).join('');
