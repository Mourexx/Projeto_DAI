import { useEffect, useRef, useMemo } from 'react'
import { LINE_COLORS } from '../../services/busService'

const CENTER = [41.5514, -8.4121]  // Centro geográfico de todas as rotas TUB
const ZOOM = 13

// Rotas GTFS reais da TUB (Transportes Urbanos de Braga)
// Fonte: dados_tun.zip (shapes.txt)
const LINE_ROUTES = {
  'L2': [
    [41.594060,-8.459310],
    [41.593380,-8.460620],
    [41.593150,-8.460860],
    [41.591410,-8.459310],
    [41.589750,-8.458420],
    [41.587940,-8.457470],
    [41.586900,-8.456300],
    [41.585380,-8.455420],
    [41.585380,-8.455420],
    [41.584340,-8.454840],
    [41.583190,-8.454300],
    [41.581200,-8.453710],
    [41.579920,-8.453440],
    [41.579130,-8.453280],
    [41.576640,-8.453180],
    [41.575120,-8.452890],
    [41.574220,-8.452730],
    [41.573060,-8.452670],
    [41.571430,-8.452300],
    [41.569880,-8.451590],
    [41.568130,-8.451090],
    [41.565230,-8.450310],
    [41.564460,-8.449980],
    [41.561780,-8.448200],
    [41.561530,-8.448030],
    [41.561140,-8.447660],
    [41.560240,-8.446330],
    [41.560110,-8.446170],
    [41.560050,-8.445980],
    [41.557740,-8.442150],
    [41.557620,-8.442040],
    [41.557550,-8.441960],
    [41.557490,-8.441960],
    [41.556410,-8.441860],
    [41.555630,-8.441850],
    [41.554680,-8.441480],
    [41.554040,-8.440950],
    [41.553790,-8.440340],
    [41.553970,-8.438330],
    [41.553630,-8.436770],
    [41.553430,-8.436230],
    [41.553170,-8.435940],
    [41.552880,-8.435780],
    [41.552390,-8.435800],
    [41.552010,-8.436120],
    [41.551540,-8.436930],
    [41.551200,-8.437800],
    [41.550750,-8.438200],
    [41.550460,-8.438170],
    [41.549920,-8.437520],
    [41.549660,-8.437010],
    [41.549220,-8.435350],
    [41.549190,-8.434650],
    [41.549070,-8.433810],
    [41.549260,-8.433600],
    [41.549660,-8.433470],
    [41.549840,-8.433130],
    [41.550050,-8.431370],
    [41.550500,-8.429640],
    [41.550880,-8.429470],
    [41.551570,-8.428900],
    [41.552079,-8.427687],
    [41.552839,-8.427676],
    [41.552972,-8.424725],
    [41.550989,-8.422903],
    [41.549875,-8.422188],
    [41.549338,-8.421851],
    [41.549030,-8.421645],
    [41.548777,-8.421511],
    [41.548598,-8.421399],
    [41.548454,-8.421304],
    [41.548351,-8.421249],
    [41.548110,-8.421140],
    [41.546300,-8.420080],
    [41.545870,-8.419650],
    [41.546400,-8.418630],
    [41.547550,-8.417480],
    [41.548350,-8.416480],
    [41.548710,-8.415990],
    [41.549500,-8.414060],
    [41.549700,-8.413710],
    [41.550470,-8.411850],
    [41.551790,-8.408700],
    [41.553280,-8.405170],
    [41.555240,-8.400430],
    [41.556300,-8.397210],
    [41.556380,-8.393860],
    [41.557650,-8.393060],
    [41.557840,-8.392390],
    [41.557810,-8.391910],
    [41.557500,-8.390820],
    [41.557240,-8.389720],
    [41.556830,-8.389080],
    [41.556340,-8.388720],
    [41.555830,-8.388560],
    [41.555520,-8.388300],
    [41.555360,-8.387920],
    [41.555420,-8.387140],
    [41.555620,-8.386170],
    [41.555300,-8.385450],
    [41.555030,-8.385310],
    [41.554690,-8.385310],
    [41.553820,-8.385410],
    [41.553700,-8.385340],
    [41.553350,-8.384680],
    [41.553390,-8.383290],
    [41.553090,-8.382370],
    [41.552540,-8.381790],
    [41.552090,-8.381610],
    [41.552040,-8.381490],
    [41.552270,-8.380920],
    [41.552340,-8.380870],
    [41.553080,-8.380960],
    [41.554070,-8.381390]
  ],
  'L3': [
    [41.551797,-8.419871],
    [41.553808,-8.423641],
    [41.556058,-8.421942],
    [41.556519,-8.419911],
    [41.557472,-8.417845],
    [41.557883,-8.417311],
    [41.558255,-8.417939],
    [41.559913,-8.418673],
    [41.560175,-8.418219],
    [41.561383,-8.418105],
    [41.563206,-8.418483],
    [41.563622,-8.418002],
    [41.563328,-8.417568],
    [41.562936,-8.417920],
    [41.562963,-8.419243],
    [41.563377,-8.419809],
    [41.563883,-8.419940],
    [41.565178,-8.419717],
    [41.567354,-8.421786],
    [41.568563,-8.422270],
    [41.569326,-8.423281],
    [41.569857,-8.423363],
    [41.572071,-8.422978],
    [41.572149,-8.423452],
    [41.572322,-8.424219],
    [41.573030,-8.425389],
    [41.572026,-8.429456],
    [41.571367,-8.429983],
    [41.570638,-8.429948],
    [41.570131,-8.430724],
    [41.568676,-8.431832],
    [41.568319,-8.432777],
    [41.567846,-8.435717],
    [41.567388,-8.438159],
    [41.567064,-8.438599],
    [41.566282,-8.438701],
    [41.565572,-8.439797],
    [41.560461,-8.445860],
    [41.560892,-8.447203],
    [41.563906,-8.449672],
    [41.564995,-8.450226],
    [41.567768,-8.450985],
    [41.569823,-8.451546],
    [41.574403,-8.452751],
    [41.579331,-8.453282],
    [41.580638,-8.453523],
    [41.586795,-8.456192],
    [41.587656,-8.457243],
    [41.585783,-8.460309],
    [41.586203,-8.461123],
    [41.586309,-8.461606],
    [41.585782,-8.463947],
    [41.585752,-8.465138],
    [41.586051,-8.467756],
    [41.586144,-8.469271],
    [41.585352,-8.471432],
    [41.584811,-8.472405],
    [41.583742,-8.473064],
    [41.581255,-8.475445],
    [41.580667,-8.475955]
  ],
  'L5': [
    [41.579810,-8.439830],
    [41.578610,-8.439620],
    [41.578000,-8.439490],
    [41.577270,-8.439730],
    [41.576480,-8.440080],
    [41.575700,-8.439940],
    [41.575230,-8.439440],
    [41.574580,-8.438310],
    [41.574310,-8.437940],
    [41.573570,-8.436930],
    [41.573200,-8.436330],
    [41.572500,-8.436260],
    [41.572180,-8.435830],
    [41.571730,-8.434850],
    [41.571430,-8.434480],
    [41.571090,-8.434510],
    [41.570710,-8.434750],
    [41.569270,-8.434490],
    [41.567780,-8.433960],
    [41.566260,-8.433400],
    [41.565790,-8.433200],
    [41.565600,-8.433000],
    [41.565430,-8.433000],
    [41.565320,-8.432990],
    [41.565120,-8.432720],
    [41.564460,-8.432680],
    [41.563530,-8.432660],
    [41.561930,-8.433240],
    [41.561120,-8.432890],
    [41.560340,-8.432670],
    [41.559780,-8.433150],
    [41.559610,-8.433220],
    [41.558600,-8.432620],
    [41.557580,-8.432260],
    [41.557030,-8.431500],
    [41.556670,-8.430880],
    [41.556300,-8.430840],
    [41.556090,-8.430980],
    [41.556010,-8.431100],
    [41.555910,-8.431090],
    [41.555590,-8.430760],
    [41.554860,-8.430690],
    [41.554320,-8.430610],
    [41.553600,-8.430270],
    [41.552790,-8.429850],
    [41.551980,-8.429380],
    [41.551620,-8.429120],
    [41.551823,-8.428324],
    [41.552742,-8.427859],
    [41.552913,-8.425789],
    [41.552789,-8.424325],
    [41.550894,-8.422827],
    [41.550424,-8.422511],
    [41.549991,-8.422242],
    [41.549647,-8.422043],
    [41.549122,-8.421738],
    [41.548794,-8.421548],
    [41.548198,-8.421190],
    [41.547820,-8.419740],
    [41.548030,-8.419220],
    [41.548610,-8.418610],
    [41.549800,-8.417070],
    [41.550690,-8.414940],
    [41.551610,-8.412700],
    [41.550470,-8.411850],
    [41.550570,-8.411070],
    [41.548780,-8.410130],
    [41.548040,-8.409760],
    [41.547470,-8.409390],
    [41.547320,-8.409510],
    [41.546220,-8.411720],
    [41.545860,-8.412700],
    [41.544360,-8.412180],
    [41.543300,-8.411450],
    [41.542980,-8.411270],
    [41.542800,-8.410740],
    [41.542460,-8.410330],
    [41.542390,-8.410170],
    [41.540800,-8.408560],
    [41.540260,-8.408030],
    [41.540110,-8.408070],
    [41.540040,-8.408210],
    [41.540040,-8.409880],
    [41.538890,-8.409670]
  ],
  'L7': [
    [41.574040,-8.348270],
    [41.574740,-8.348820],
    [41.575060,-8.349880],
    [41.575390,-8.351230],
    [41.575230,-8.352920],
    [41.575070,-8.354960],
    [41.574730,-8.356900],
    [41.574350,-8.360330],
    [41.574440,-8.360930],
    [41.574860,-8.362160],
    [41.573320,-8.365710],
    [41.573510,-8.367150],
    [41.573910,-8.368130],
    [41.572310,-8.371490],
    [41.571930,-8.372340],
    [41.571870,-8.373190],
    [41.571690,-8.373960],
    [41.571040,-8.375020],
    [41.570790,-8.375770],
    [41.570530,-8.377540],
    [41.569990,-8.378310],
    [41.568800,-8.380010],
    [41.567120,-8.384660],
    [41.566750,-8.385550],
    [41.565400,-8.387610],
    [41.564880,-8.388000],
    [41.564140,-8.388120],
    [41.562440,-8.388030],
    [41.561850,-8.388480],
    [41.561540,-8.389070],
    [41.561030,-8.392800],
    [41.560770,-8.393580],
    [41.558340,-8.397960],
    [41.558140,-8.398050],
    [41.558020,-8.397890],
    [41.557870,-8.397790],
    [41.557030,-8.397750],
    [41.556710,-8.397810],
    [41.556570,-8.397910],
    [41.556370,-8.398150],
    [41.556070,-8.398820],
    [41.555030,-8.401150],
    [41.553440,-8.405050],
    [41.553050,-8.406060],
    [41.553040,-8.406210],
    [41.553090,-8.406440],
    [41.553290,-8.406620],
    [41.554070,-8.406800],
    [41.555160,-8.407010],
    [41.558920,-8.407280],
    [41.560040,-8.407270],
    [41.560240,-8.407420],
    [41.560240,-8.407650],
    [41.560050,-8.407840],
    [41.558970,-8.407590],
    [41.557130,-8.407330],
    [41.554800,-8.408390],
    [41.553010,-8.411620],
    [41.552080,-8.415880],
    [41.551261,-8.417675],
    [41.549793,-8.420178],
    [41.549334,-8.420958],
    [41.549015,-8.421547],
    [41.546900,-8.420500],
    [41.545870,-8.420120],
    [41.544420,-8.426550],
    [41.543960,-8.427860],
    [41.542850,-8.430600],
    [41.542380,-8.431940],
    [41.539870,-8.433240],
    [41.539380,-8.433750],
    [41.538060,-8.434550],
    [41.534700,-8.437580],
    [41.532110,-8.439690],
    [41.531290,-8.440440],
    [41.530550,-8.441600],
    [41.529870,-8.443570],
    [41.529150,-8.446910],
    [41.528620,-8.447380],
    [41.525970,-8.448340],
    [41.524940,-8.448840],
    [41.523510,-8.448990],
    [41.522920,-8.449810],
    [41.522030,-8.450740],
    [41.519370,-8.450790],
    [41.517590,-8.450590],
    [41.516580,-8.449620],
    [41.515730,-8.449510],
    [41.514790,-8.449730],
    [41.512200,-8.451120],
    [41.508780,-8.452980],
    [41.508670,-8.453540],
    [41.510000,-8.455110],
    [41.512470,-8.453250],
    [41.514340,-8.456190]
  ],
  'L8': [
    [41.575460,-8.400390],
    [41.574010,-8.400530],
    [41.573740,-8.401850],
    [41.572490,-8.402300],
    [41.572350,-8.402650],
    [41.571780,-8.403990],
    [41.571510,-8.405140],
    [41.571280,-8.405830],
    [41.571120,-8.405990],
    [41.570670,-8.406310],
    [41.570030,-8.406610],
    [41.569290,-8.407140],
    [41.568900,-8.407430],
    [41.568010,-8.408570],
    [41.566850,-8.410380],
    [41.566300,-8.410970],
    [41.565290,-8.411750],
    [41.564010,-8.412320],
    [41.562400,-8.412660],
    [41.561950,-8.412780],
    [41.561600,-8.413140],
    [41.560000,-8.414260],
    [41.559830,-8.414680],
    [41.559640,-8.414890],
    [41.559260,-8.414840],
    [41.558520,-8.415270],
    [41.558150,-8.415550],
    [41.557810,-8.416360],
    [41.557700,-8.417160],
    [41.557870,-8.417360],
    [41.557960,-8.417510],
    [41.557940,-8.417780],
    [41.557690,-8.417910],
    [41.557530,-8.417680],
    [41.555580,-8.417080],
    [41.551980,-8.417150],
    [41.551737,-8.417424],
    [41.551641,-8.418012],
    [41.551726,-8.419163]
  ],
  'L1': [
    [41.545672,-8.407992],
    [41.545557,-8.407662],
    [41.543686,-8.406990],
    [41.540798,-8.408466],
    [41.540396,-8.408164],
    [41.540830,-8.407331],
    [41.541254,-8.406142],
    [41.541629,-8.402758],
    [41.541750,-8.401481],
    [41.541917,-8.399304],
    [41.541859,-8.398783],
    [41.542188,-8.398643],
    [41.542485,-8.398997],
    [41.544108,-8.399329],
    [41.544742,-8.399146],
    [41.545091,-8.399059],
    [41.546002,-8.398309],
    [41.546687,-8.397566],
    [41.547065,-8.397154],
    [41.547726,-8.396613],
    [41.548446,-8.396007],
    [41.549280,-8.395674],
    [41.551518,-8.395378],
    [41.553122,-8.395068],
    [41.555974,-8.394870],
    [41.556275,-8.395325],
    [41.556162,-8.396055],
    [41.556684,-8.397317]
  ]
}

// Paragens reais por linha (source: stops.txt + stop_times.txt)
const LINE_STOPS = {
  'L2': [
    {name:"PONTE DE PRADO (MARGINAL)",lat:41.594085,lon:-8.459339},
    {name:"PRESA II",lat:41.592657,lon:-8.460386},
    {name:"PRESA I",lat:41.590121,lon:-8.458573},
    {name:"CARMO III (VIEIRA)",lat:41.587306,lon:-8.456719},
    {name:"CARMO II",lat:41.586000,lon:-8.455819},
    {name:"CARMO I (CAPELA)",lat:41.582044,lon:-8.453932},
    {name:"PATEIRA III",lat:41.579128,lon:-8.453290},
    {name:"PATEIRA II",lat:41.575957,lon:-8.453036},
    {name:"PATEIRA I",lat:41.573167,lon:-8.452675},
    {name:"RAMOA",lat:41.570961,lon:-8.452098},
    {name:"BAIXO II (LIMITE 2/1)",lat:41.568368,lon:-8.451130},
    {name:"BAIXO I",lat:41.565944,lon:-8.450496},
    {name:"CIMA II",lat:41.564357,lon:-8.449926},
    {name:"CIMA I",lat:41.560556,lon:-8.446783},
    {name:"VARIANTE REAL",lat:41.559775,lon:-8.445392},
    {name:"S FRUTUOSO",lat:41.557120,lon:-8.442300},
    {name:"COSTA GOMES II",lat:41.553816,lon:-8.440425},
    {name:"COSTA GOMES I",lat:41.553840,lon:-8.437619},
    {name:"NOVA ESTA\u00c7\u00c3O II",lat:41.549349,lon:-8.436049},
    {name:"ROTUNDA ESTA\u00c7\u00c3O I",lat:41.549127,lon:-8.434159},
    {name:"BISCAINHOS",lat:41.550476,lon:-8.429557},
    {name:"CONS TORRES ALMEIDA I",lat:41.551969,lon:-8.427839},
    {name:"CONDE AGROLONGO III",lat:41.552832,lon:-8.426627},
    {name:"LIBERDADE (25 DE ABRIL)",lat:41.547803,lon:-8.421009},
    {name:"JO\u00c3O XXI (31 DE JANEIRO I)",lat:41.548450,lon:-8.416286},
    {name:"JO\u00c3O XXI (C AMARANTE)",lat:41.550037,lon:-8.412784},
    {name:"JO\u00c3O PAULO II (PISCINAS)",lat:41.551131,lon:-8.410154},
    {name:"JO\u00c3O PAULO II (PARQUE RODOVIA)",lat:41.553754,lon:-8.403827},
    {name:"JO\u00c3O PAULO II (INL)",lat:41.555188,lon:-8.400393},
    {name:"LUS\u00cdADAS I",lat:41.555986,lon:-8.395839},
    {name:"LUS\u00cdADAS II",lat:41.556487,lon:-8.393745},
    {name:"LUS\u00cdADAS III",lat:41.557473,lon:-8.390830},
    {name:"LUS\u00cdADAS IV (TEN\u00d5ES)",lat:41.556118,lon:-8.388640},
    {name:"REP\u00daBLICA I",lat:41.555537,lon:-8.386674},
    {name:"REP\u00daBLICA II",lat:41.553333,lon:-8.384117},
    {name:"BOM JESUS",lat:41.554462,lon:-8.381193}
  ],
  'L3': [
    {name:"CENTRAL I",lat:41.551870,lon:-8.419851},
    {name:"A HERCULANO (PENEDOS)",lat:41.554063,lon:-8.423612},
    {name:"CONS JANU\u00c1RIO (IGREJA)",lat:41.556143,lon:-8.421504},
    {name:"CONS JANU\u00c1RIO (S\u00c1 DE MIRANDA)",lat:41.557056,lon:-8.418748},
    {name:"INFIAS",lat:41.557990,lon:-8.417325},
    {name:"CABANAS",lat:41.559439,lon:-8.418493},
    {name:"CONFEITEIRA I (ESCOLA PROFISSIONAL)",lat:41.564249,lon:-8.419776},
    {name:"CONFEITEIRA II (CABANAS)",lat:41.566027,lon:-8.420376},
    {name:"CONFEITEIRA III",lat:41.570924,lon:-8.423078},
    {name:"MANUEL J MACHADO I",lat:41.572800,lon:-8.424762},
    {name:"MANUEL J MACHADO II",lat:41.572593,lon:-8.428145},
    {name:"JOGO DA BOLA",lat:41.571858,lon:-8.429689},
    {name:"ALFREDO J SOUSA I",lat:41.570114,lon:-8.430794},
    {name:"S ROSENDO (DUME)",lat:41.568033,lon:-8.434335},
    {name:"S FRUTUOSO (CARCAVELOS)",lat:41.567452,lon:-8.437674},
    {name:"RECTA FEITAL I",lat:41.564902,lon:-8.440429},
    {name:"RECTA FEITAL II",lat:41.563333,lon:-8.442361},
    {name:"RECTA FEITAL III (P INDUSTRIAL)",lat:41.562551,lon:-8.443326},
    {name:"RECTA FEITAL IV",lat:41.560803,lon:-8.445459},
    {name:"CIMA I",lat:41.560608,lon:-8.446697},
    {name:"CIMA II",lat:41.564183,lon:-8.449716},
    {name:"BAIXO I",lat:41.566325,lon:-8.450525},
    {name:"BAIXO II (LIMITE 1/2)",lat:41.568377,lon:-8.451051},
    {name:"RAMOA",lat:41.570931,lon:-8.452004},
    {name:"PATEIRA I",lat:41.573167,lon:-8.452606},
    {name:"PATEIRA II",lat:41.575954,lon:-8.452955},
    {name:"PATEIRA III",lat:41.579137,lon:-8.453194},
    {name:"CARMO I (CAPELA)",lat:41.582040,lon:-8.453871},
    {name:"CARMO II",lat:41.585255,lon:-8.455255},
    {name:"CARMO III (VIEIRA)",lat:41.587338,lon:-8.456655},
    {name:"S\u00c3O BENTO",lat:41.586739,lon:-8.458725},
    {name:"DEVESA I (CEMIT\u00c9RIO)",lat:41.586321,lon:-8.462035},
    {name:"CACHADA I",lat:41.585853,lon:-8.465433},
    {name:"CACHADA II",lat:41.586006,lon:-8.466699},
    {name:"BOU\u00c7A I",lat:41.585589,lon:-8.470921},
    {name:"BOU\u00c7A II",lat:41.584141,lon:-8.472824},
    {name:"BOU\u00c7A III",lat:41.583011,lon:-8.473806},
    {name:"RU\u00c3ES",lat:41.581578,lon:-8.475342},
    {name:"RU\u00c3ES (S MARTINHO TIB\u00c3ES-VERDES)",lat:41.580040,lon:-8.476050}
  ],
  'L5': [
    {name:"DUME (ENTRE-PORTAS II)",lat:41.579789,lon:-8.439883},
    {name:"ENTRE-PORTAS I",lat:41.575694,lon:-8.439958},
    {name:"REGO",lat:41.571427,lon:-8.434469},
    {name:"C\u00d3NEGO INSUELAS",lat:41.569572,lon:-8.434650},
    {name:"S MARTINHO (PASSAL)",lat:41.566206,lon:-8.433386},
    {name:"S MARTINHO (EST\u00c1DIO)",lat:41.563938,lon:-8.432782},
    {name:"S MARTINHO (S JER\u00d3NIMO)",lat:41.560691,lon:-8.432787},
    {name:"S MARTINHO (BAIRRO)",lat:41.558602,lon:-8.432689},
    {name:"FEIRA (PARRETAS)",lat:41.555552,lon:-8.430753},
    {name:"S. MARTINHO (VIADUTO)",lat:41.553647,lon:-8.430394},
    {name:"CONS TORRES ALMEIDA I",lat:41.551969,lon:-8.427839},
    {name:"CONDE AGROLONGO III",lat:41.552832,lon:-8.426627},
    {name:"25 DE ABRIL (PARQUE INFANTIL)",lat:41.547932,lon:-8.419246},
    {name:"25 DE ABRIL (D MARIA II - III)",lat:41.549252,lon:-8.417834},
    {name:"BEATO M CARVALHO (RESTAURA\u00c7\u00c3O)",lat:41.550651,lon:-8.414910},
    {name:"BEATO M CARVALHO (MARTINS SARMENTO)",lat:41.551510,lon:-8.412894},
    {name:"BERNARDO SEQUEIRA",lat:41.548766,lon:-8.410171},
    {name:"BAIXO",lat:41.546280,lon:-8.411749},
    {name:"PORF\u00cdRIO SILVA",lat:41.543637,lon:-8.411674},
    {name:"SIM\u00d5ES ALMEIDA I",lat:41.542056,lon:-8.409888},
    {name:"SIM\u00d5ES ALMEIDA II (B D PACHECO)",lat:41.540797,lon:-8.408556},
    {name:"QUINTA DA CAPELA (FOR\u00c7AS ARMADAS)",lat:41.538887,lon:-8.409676}
  ],
  'L7': [
    {name:"PA\u00c7O",lat:41.574194,lon:-8.348370},
    {name:"PREGAL II",lat:41.575163,lon:-8.349231},
    {name:"PREGAL I",lat:41.575365,lon:-8.351975},
    {name:"PIDRE",lat:41.574881,lon:-8.355427},
    {name:"CAMPO II",lat:41.574748,lon:-8.358692},
    {name:"CAMPO I",lat:41.574658,lon:-8.361394},
    {name:"PINHEIRO VELHO III",lat:41.574155,lon:-8.364011},
    {name:"PINHEIRO VELHO II",lat:41.573397,lon:-8.366729},
    {name:"PINHEIRO VELHO I",lat:41.573763,lon:-8.367479},
    {name:"MARCO (LIMITE 2/1)",lat:41.573311,lon:-8.369574},
    {name:"BELA VISTA III",lat:41.571928,lon:-8.372841},
    {name:"BELA VISTA II",lat:41.570735,lon:-8.376502},
    {name:"BELA VISTA I",lat:41.569839,lon:-8.378532},
    {name:"INFANTE D HENRIQUE II",lat:41.568541,lon:-8.380842},
    {name:"INFANTE D HENRIQUE I",lat:41.567404,lon:-8.384000},
    {name:"LAMEIRA",lat:41.566252,lon:-8.386427},
    {name:"ESTRADA NOVA II (FONTE GRILO)",lat:41.563315,lon:-8.388030},
    {name:"ESTRADA NOVA I",lat:41.561381,lon:-8.390485},
    {name:"GUALTAR II",lat:41.560346,lon:-8.394456},
    {name:"UNIVERSIDADE DO MINHO II",lat:41.557592,lon:-8.397836},
    {name:"JO\u00c3O PAULO II (INL)",lat:41.555159,lon:-8.401123},
    {name:"JO\u00c3O PAULO II (PARQUE RODOVIA)",lat:41.554134,lon:-8.403511},
    {name:"J\u00daLIO FRAGATA I",lat:41.556264,lon:-8.406979},
    {name:"J\u00daLIO FRAGATA II",lat:41.559570,lon:-8.407222},
    {name:"J\u00daLIO FRAGATA III",lat:41.559312,lon:-8.407633},
    {name:"J\u00daLIO FRAGATA IV",lat:41.556998,lon:-8.407299},
    {name:"D PEDRO V - II",lat:41.554822,lon:-8.408511},
    {name:"D PEDRO V - I",lat:41.552808,lon:-8.412279},
    {name:"S VICTOR",lat:41.552323,lon:-8.415117},
    {name:"RAIO (SENHORA-A-BRANCA)",lat:41.551279,lon:-8.417666},
    {name:"RAIO (JO\u00c3O PENHA)",lat:41.549164,lon:-8.421299},
    {name:"LIBERDADE (IGREJA S L\u00c1ZARO I)",lat:41.546857,lon:-8.420460},
    {name:"IMAC CONCEI\u00c7\u00c3O (FUJACAL)",lat:41.545097,lon:-8.423737},
    {name:"IMAC CONCEI\u00c7\u00c3O (COLINA)",lat:41.543933,lon:-8.428011},
    {name:"IMAC CONCEI\u00c7\u00c3O (STO CONDEST\u00c1VEL)",lat:41.543167,lon:-8.429874},
    {name:"CIDADE PORTO I",lat:41.539102,lon:-8.433800},
    {name:"CIDADE PORTO II",lat:41.537382,lon:-8.435150},
    {name:"CIDADE PORTO III",lat:41.535310,lon:-8.436980},
    {name:"CIDADE PORTO IV",lat:41.532465,lon:-8.439392},
    {name:"CIDADE PORTO V",lat:41.530358,lon:-8.442168},
    {name:"CIDADE PORTO VI",lat:41.529679,lon:-8.445311},
    {name:"MARIA D SILVA (CENTRO EMPRESARIAL)",lat:41.527723,lon:-8.447651},
    {name:"MARIA D SILVA",lat:41.526257,lon:-8.448212},
    {name:"ANT\u00d3NIO CABRAL (LIMITE 1/2)",lat:41.525299,lon:-8.448668},
    {name:"PONTE DAS TRAVES I",lat:41.521790,lon:-8.450798},
    {name:"PONTE DAS TRAVES II",lat:41.518437,lon:-8.450704},
    {name:"PONTE DAS TRAVES III",lat:41.516810,lon:-8.449814},
    {name:"S LOUREN\u00c7O II",lat:41.514091,lon:-8.450113},
    {name:"S LOUREN\u00c7O III (CRUZAMENTO)",lat:41.511647,lon:-8.451446},
    {name:"S LOUREN\u00c7O IV",lat:41.508940,lon:-8.452908},
    {name:"PAULO G PINTO",lat:41.511593,lon:-8.453801},
    {name:"17 DE DEZEMBRO (CELEIR\u00d3S)",lat:41.514587,lon:-8.455824}
  ],
  'L8': [
    {name:"SETE FONTES II",lat:41.575460,lon:-8.400457},
    {name:"SETE FONTES I",lat:41.573832,lon:-8.401737},
    {name:"RAFAEL B PINHEIRO III",lat:41.572159,lon:-8.403374},
    {name:"RAFAEL B PINHEIRO II",lat:41.571146,lon:-8.406037},
    {name:"RAFAEL B PINHEIRO I",lat:41.569664,lon:-8.406967},
    {name:"AREAL CIMA IV",lat:41.567796,lon:-8.409040},
    {name:"AREAL CIMA III",lat:41.566313,lon:-8.411009},
    {name:"AREAL CIMA II",lat:41.564936,lon:-8.411972},
    {name:"TIMOR II",lat:41.561795,lon:-8.413028},
    {name:"TIMOR I",lat:41.560493,lon:-8.413952},
    {name:"LOUREIRO AMORIM",lat:41.559083,lon:-8.414921},
    {name:"CONS BENTO MIGUEL",lat:41.557822,lon:-8.416490},
    {name:"SANTA MARGARIDA (S\u00c1 DE MIRANDA)",lat:41.556685,lon:-8.417326},
    {name:"SANTA MARGARIDA (CAM\u00d5ES)",lat:41.553830,lon:-8.417063},
    {name:"SENHORA-A-BRANCA",lat:41.551758,lon:-8.417525},
    {name:"CENTRAL I",lat:41.551870,lon:-8.419851}
  ],
  'L1': [
    {name:"NASCENTE",lat:41.545652,lon:-8.407985},
    {name:"MACHADO OWEN (RESID\u00caNCIA UM I)",lat:41.545205,lon:-8.407564},
    {name:"MACHADO OWEN (RESID\u00caNCIA UM II)",lat:41.544543,lon:-8.407403},
    {name:"MACHADO OWEN (B D PACHECO)",lat:41.542325,lon:-8.407565},
    {name:"MACHADO OWEN (SIM\u00d5ES ALMEIDA)",lat:41.541042,lon:-8.408378},
    {name:"ROBERT SMITH II",lat:41.541256,lon:-8.405275},
    {name:"ROBERT SMITH I",lat:41.541849,lon:-8.400117},
    {name:"D JO\u00c3O II II",lat:41.553842,lon:-8.394971},
    {name:"UNIVERSIDADE DO MINHO II",lat:41.557578,lon:-8.397586}
  ]
}

// Normaliza 'L1', '1', 'l1' → 'L1'
function normalizeLineId(line) {
  if (!line) return null
  const s = String(line).trim()
  if (/^L\d+$/i.test(s)) return s.toUpperCase()
  if (/^\d+$/.test(s)) return 'L' + s
  return s
}

function getOccupancyColor(occupancy, capacity) {
  const pct = occupancy / capacity
  if (pct < 0.5) return '#22C55E'
  if (pct < 0.8) return '#F59E0B'
  return '#EF4444'
}

function getOccupancyLabel(occupancy, capacity) {
  const pct = occupancy / capacity
  if (pct < 0.5) return 'Livre'
  if (pct < 0.8) return 'Moderado'
  return 'Lotado'
}

export default function BusMap({ buses, activeLines, onSelectBus, selectedBus }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const routeLayersRef = useRef([])
  const infoMarkerRef = useRef(null)

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    const initMap = () => {
      if (!window.L || mapInstanceRef.current) return
      const map = window.L.map(mapRef.current, {
        center: CENTER,
        zoom: ZOOM,
        zoomControl: true,
        attributionControl: false,
      })

      window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '© Google Maps',
      }).addTo(map)

      mapInstanceRef.current = map
    }

    if (window.L) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const visibleBuses = useMemo(
    () => buses.filter(b => activeLines.includes(b.line)),
    [buses, activeLines]
  )

  function clearRouteLayers() {
    if (!mapInstanceRef.current) return
    routeLayersRef.current.forEach(layer => {
      try { mapInstanceRef.current.removeLayer(layer) } catch(e) {}
    })
    routeLayersRef.current = []
  }

  function clearInfoMarker() {
    if (!mapInstanceRef.current || !infoMarkerRef.current) return
    try { mapInstanceRef.current.removeLayer(infoMarkerRef.current) } catch(e) {}
    infoMarkerRef.current = null
  }

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return
    const L = window.L
    const map = mapInstanceRef.current

    const visibleIds = new Set(visibleBuses.map(b => b.id))
    Object.keys(markersRef.current).forEach(id => {
      if (!visibleIds.has(id)) {
        map.removeLayer(markersRef.current[id])
        delete markersRef.current[id]
      }
    })

    visibleBuses.forEach(bus => {
      const lat = bus.lat ?? bus.latitude
      const lng = bus.lng ?? bus.longitude
      if (!lat || !lng) return

      const color = LINE_COLORS[bus.line] || '#005BAC'
      const isSelected = selectedBus?.id === bus.id
      const isMoving = bus.status === 'active' || bus.speed > 0

      const size = isSelected ? 42 : 34

      const html = `
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};
          border:${isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.8)'};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 12px ${color}66;
          cursor:pointer;position:relative;
          transition:all 0.2s;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
          <div style="
            position:absolute;top:-7px;right:-7px;
            background:${color};color:white;
            font-size:9px;font-weight:900;font-family:monospace;
            border-radius:4px;padding:1px 4px;
            border:1.5px solid white;
          ">${bus.line}</div>
          ${isMoving && !isSelected ? `<div style="
            position:absolute;inset:-5px;border-radius:50%;
            border:2px solid ${color};opacity:0.4;
            animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;
            pointer-events:none;
          "></div>` : ''}
        </div>
      `

      const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size/2, size/2] })

      if (markersRef.current[bus.id]) {
        markersRef.current[bus.id].setLatLng([lat, lng])
        markersRef.current[bus.id].setIcon(icon)
      } else {
        const marker = L.marker([lat, lng], { icon })

        // Click → seleciona o autocarro (abre o painel lateral)
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          onSelectBus(bus)
        })

        // Hover → mostra rota correta + painel de info no canto superior direito do mapa
        marker.on('mouseover', () => {
          clearRouteLayers()
          clearInfoMarker()

          // Rota correta para este autocarro
          const lineKey = normalizeLineId(bus.line)
          const fullRoute = LINE_ROUTES[lineKey] || []

          if (fullRoute.length > 1) {
            // Encontrar o ponto da rota mais próximo da posição atual do autocarro
            const busLatLng = L.latLng(lat, lng)
            let closestIdx = 0
            let minDist = Infinity
            fullRoute.forEach((coord, i) => {
              const d = busLatLng.distanceTo(L.latLng(coord[0], coord[1]))
              if (d < minDist) { minDist = d; closestIdx = i }
            })

            // Parte já percorrida: do início da linha até ao autocarro (tracejada e ténue)
            const donePart = [...fullRoute.slice(0, closestIdx + 1), [lat, lng]]
            if (donePart.length > 1) {
              const doneLine = L.polyline(donePart, {
                color: color,
                weight: 4,
                opacity: 0.25,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '6 6',
              }).addTo(map)
              routeLayersRef.current.push(doneLine)
            }

            // Rota a percorrer: começa na posição exata do autocarro até ao fim da linha
            const routeAhead = [[lat, lng], ...fullRoute.slice(closestIdx + 1)]

            if (routeAhead.length > 1) {
              const shadow = L.polyline(routeAhead, {
                color: '#1D4ED8',
                weight: 9,
                opacity: 0.12,
              }).addTo(map)
              routeLayersRef.current.push(shadow)

              const routeLine = L.polyline(routeAhead, {
                color: color,
                weight: 5,
                opacity: 0.92,
                lineCap: 'round',
                lineJoin: 'round',
              }).addTo(map)
              routeLayersRef.current.push(routeLine)
            }

            // Paragens reais da linha (da posição atual em diante)
            const lineStops = LINE_STOPS[lineKey] || []
            if (lineStops.length > 0) {
              // Encontrar paragem mais próxima da posição atual
              let closestStopIdx = 0
              let minStopDist = Infinity
              lineStops.forEach((stop, i) => {
                const d = busLatLng.distanceTo(L.latLng(stop.lat, stop.lon))
                if (d < minStopDist) { minStopDist = d; closestStopIdx = i }
              })
              // Renderizar paragens a partir daqui
              const aheadStops = lineStops.slice(closestStopIdx)
              aheadStops.forEach((stop, i) => {
                const isFirst = i === 0
                const isLast = i === aheadStops.length - 1
                const circle = L.circleMarker([stop.lat, stop.lon], {
                  radius: (isFirst || isLast) ? 9 : 5,
                  color: isFirst ? '#ffffff' : color,
                  fillColor: isFirst ? color : '#ffffff',
                  fillOpacity: 1,
                  weight: (isFirst || isLast) ? 3 : 2,
                }).addTo(map)
                circle.bindTooltip(stop.name, {
                  permanent: false,
                  direction: 'top',
                  className: 'stop-tooltip',
                  offset: [0, -8],
                })
                routeLayersRef.current.push(circle)
              })
            } else {
              // fallback: pontos da rota se não houver paragens
              routeAhead.forEach((coord, i) => {
                if (i === 0 || i === routeAhead.length - 1 || i % 4 === 0) {
                  const circle = L.circleMarker(coord, {
                    radius: (i === 0 || i === routeAhead.length - 1) ? 7 : 4,
                    color: color, fillColor: '#fff', fillOpacity: 1, weight: 2,
                  }).addTo(map)
                  routeLayersRef.current.push(circle)
                }
              })
            }
          }

          // Painel de informação: colocado no canto superior direito do mapa (NÃO em cima do autocarro)
          const occColor = getOccupancyColor(bus.occupancy, bus.capacity)
          const occLabel = getOccupancyLabel(bus.occupancy, bus.capacity)
          const occPct = Math.min(Math.round((bus.occupancy / bus.capacity) * 100), 100)
          const speedTxt = bus.speed != null ? `${bus.speed} km/h` : '—'
          const statusDot = bus.status === 'active' ? '#22C55E' : '#F59E0B'
          const statusTxt = bus.status === 'active' ? 'Em serviço' : 'Parado'

          const infoHtml = `
            <div style="
              background:white;border-radius:14px;padding:14px 16px;
              box-shadow:0 8px 32px rgba(0,0,0,0.20);
              font-family:'Segoe UI',sans-serif;min-width:210px;
              border:1.5px solid #E2E8F0;
              pointer-events:none;
            ">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <div style="
                  background:${color};width:30px;height:30px;border-radius:8px;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
                </div>
                <div>
                  <div style="font-weight:800;font-size:14px;color:#0F172A;">Autocarro ${bus.id}</div>
                  <div style="font-size:11px;color:${color};font-weight:700;">Linha ${bus.line}</div>
                </div>
                <div style="margin-left:auto;display:flex;align-items:center;gap:4px;">
                  <div style="width:7px;height:7px;border-radius:50%;background:${statusDot};flex-shrink:0;"></div>
                  <span style="font-size:10px;color:#64748B;">${statusTxt}</span>
                </div>
              </div>

              <div style="background:#F8FAFC;border-radius:10px;padding:10px;margin-bottom:10px;">
                <div style="font-size:10px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Lotação</div>
                <div style="background:#E2E8F0;border-radius:99px;height:8px;overflow:hidden;margin-bottom:5px;">
                  <div style="width:${occPct}%;height:100%;background:${occColor};border-radius:99px;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:12px;font-weight:700;color:${occColor};">${occLabel}</span>
                  <span style="font-size:11px;color:#94A3B8;">${bus.occupancy} / ${bus.capacity}</span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <div style="background:#F0FDF4;border-radius:8px;padding:7px 10px;">
                  <div style="font-size:9px;color:#6EE7B7;font-weight:700;text-transform:uppercase;">Velocidade</div>
                  <div style="font-size:13px;font-weight:800;color:#065F46;">${speedTxt}</div>
                </div>
                <div style="background:#EFF6FF;border-radius:8px;padding:7px 10px;">
                  <div style="font-size:9px;color:#93C5FD;font-weight:700;text-transform:uppercase;">Linha</div>
                  <div style="font-size:13px;font-weight:800;color:#1D4ED8;">${bus.line}</div>
                </div>
              </div>

              ${bus.nextStop ? `
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid #F1F5F9;font-size:11px;color:#64748B;">
                ➡ Próxima paragem: <b style="color:#1E293B;">${bus.nextStop}</b>
              </div>` : ''}
            </div>
          `

          // Posiciona o painel NO CANTO SUPERIOR DIREITO do viewport do mapa, não em cima do autocarro
          // Usamos um ponto fixo no mapa (canto) convertido para coordenadas geográficas
          const mapContainer = map.getContainer()
          const mapBounds = map.getBounds()
          // Ponto no canto superior direito com margem
          const infoLatLng = map.containerPointToLatLng(
            L.point(mapContainer.offsetWidth - 240, 20)
          )

          infoMarkerRef.current = L.marker(infoLatLng, {
            icon: L.divIcon({
              html: infoHtml,
              className: '',
              iconSize: [220, 0],
              iconAnchor: [0, 0],
            }),
            zIndexOffset: 1000,
            interactive: false,
          }).addTo(map)
        })

        marker.on('mouseout', () => {
          clearRouteLayers()
          clearInfoMarker()
        })

        marker.addTo(map)
        markersRef.current[bus.id] = marker
      }
    })
  }, [visibleBuses, selectedBus, onSelectBus])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        .leaflet-control-zoom { border: none !important; }
        .leaflet-control-zoom a {
          background: white !important;
          color: #005BAC !important;
          border: 1px solid #E2E8F0 !important;
        }
        .leaflet-control-zoom a:hover { background: #EBF4FF !important; color: #005BAC !important; }
        .stop-tooltip {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 600;
          color: #1E293B;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .stop-tooltip::before { display: none; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
