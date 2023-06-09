//// GLOBALS

// flag for when the layout algorithms are running
let running = false

let data = []

// store the labels of nodes the user has brushed over
let brushedLabels = new Set()
// create a brush that we can attach to the .graph-view displays
let brush = mkBrush()

// flag for node label visibility
let showLabels = false

// base graph that the algorithms will be laying out.
// a copy of this graph is handed to each algorithm
let baseGraph = undefined

let baseEdgeColor = "rgb(161, 190, 214)"
let hotEdgeColor = "rgb(200,0,0)"
let baseNodeColor = 'rgb(192, 147, 250)'
let hotNodeColor = 'rgb(255,0,0)'
let coldNodeColor = 'rgb(117, 193, 255)'
let heatedColors = false

// call edgeColorScale
let edgeColorScale = undefined
let nodeColorScale = undefined

function mkColorScale() {
  let heatScale = d3.scalePow()
    .exponent(1.5)
    .domain([0, baseGraph.diam()*0.5])
    .range([hotNodeColor, coldNodeColor])

  nodeColorScale = node => {
    if (heatedColors) {
      let minDist = baseGraph.diam()
      brushedLabels.forEach(u => minDist = Math.min(minDist, baseGraph.dist(u,node)))
      return heatScale(minDist)
    } else {
      return brushedLabels.has(node) ? hotNodeColor : baseNodeColor
    }
  }
}

// make a brush to attach to a .graph-view that
// will pause the simulation and set brushedLabels to
// the labels of the nodes inside the brushed area
function mkBrush() {
  let wasRunning = running

  return d3.brush()
    .on("start", function() {
      // the viewbox scaling makes the selection border to big
      d3.select(this)
        .select(".selection")
        .style("stroke-width", 0)

      wasRunning = running
      if (running) stopSimulation()
    })
    .on("brush", function({selection}, algo) {
      // get the labels of the nodes within the brushed area
      const [[x0,y0], [x1,y1]] = selection
      const labels = algo.nodes
        .filter(n => n.x > x0 && n.x < x1 && n.y > y0 && n.y < y1)
        .map(n => n.label)
      brushedLabels = new Set([...labels])
    })
    .on("end", function() {
      drawGraphs()
      if (wasRunning) startSimulation()
      // hide the brush selection box by giving it size zero
      d3.select(this)
        .select(".selection")
        .attr("width", 0)
        .attr("height", 0)
    })
    .handleSize(0)
}

// reset the brushes because the viewbox on the graph displays changes
function updateBrushes() {
  d3.selectAll(".graph-view")
    .append("g")
    .attr("class", "brush")
    .call(brush)
}

// draw a graph in the given svg
function draw(graph, svg) {
  const nodes = graph.nodeList()
  const edges = graph.edgeList()

  // fit the svg for the graph
  const [[minX, maxX], [minY, maxY]] = graph.getBounds()
  const width = Math.max(maxX-minX,1)
  const height = Math.max(maxY-minY,1)
  
  // size nodes/edgestroke based on how wide the graph is
  const nodeRadius = Math.sqrt((width*height)/(nodes.length*Math.PI*20))
  const edgeThickness = nodeRadius / 5

  // position and scale viewbox according to graph node positions
  const margin = nodeRadius*10
  svg.attr("viewBox", `${minX-margin} ${minY-margin} ${width+margin*2} ${height+margin*2}`)

    // draw lines for edges
  svg.selectAll(".edge")
    .data(edges)
    .join("path")
    .attr("class", "edge")
    .attr("d", ([node1, node2]) => {
      const {x:x1, y:y1} = graph.node(node1).pos
      const {x:x2, y:y2} = graph.node(node2).pos
      return d3.line()([[x1,y1], [x2,y2]])
    })
    .attr("fill", "none")
    .attr("stroke", baseEdgeColor)
    .attr("stroke-width", edgeThickness)

    // draw a circle for each node
  svg.selectAll(".node")
    .data(nodes)
    .join("circle")
    .attr("class", "node")
    .attr("cx", node => node.pos.x)
    .attr("cy", node => node.pos.y)
    .attr("r", node => node.highlight ? nodeRadius*3: nodeRadius)
    //.attr("fill", n => brushedLabels.has(n.label) ? hotNodeColor : baseNodeColor)
    .attr("fill", n => nodeColorScale(n.label))
    .raise()

  if (showLabels)
  svg.selectAll(".label")
    .data(nodes)
    .join("text")
    .attr("class", "label")
    .text(n => n.label)
    .attr("x", node => node.pos.x)
    .attr("y", node => node.pos.y+nodeRadius*0.8)
    .style("text-anchor", "middle")
    .style("font-size", node => {
      let size = nodeRadius*2
      //if (node.highlight) size *= 2
      if (brushedLabels.has(node.label)) size *= 2
      return size
    })
    .style("fill", "0")
    .on("click", (_,n) => console.log(n))
    .raise()

  if (!showLabels)
  svg.selectAll(".label").remove()
}


function initGraph(graph) {
  stopSimulation()

  baseGraph = graph
  assignRandomLayout(baseGraph)
  baseGraph.computeDistances()
  data.forEach(algo => (algo.setGraph(baseGraph.copy()), algo.reset()))

  brushedLabels = new Set()
  mkColorScale()

  mkSvgs()
  updateBtns()
}


/**
 * Construct an SVG for each algorithm
 */
function mkSvgs() {
  let width = 300

  // clear out the algorithm displays
  d3.selectAll(".algo-div").remove()
  
  // containers for each algorithm display
  let divs = d3.select("body")
    .selectAll(".algo-div")
    .data(data)
    .join("div")
    .attr("class", "algo-div")
    .style("display", "inline-block")

  // header
  divs.append("h3").text(algo=>algo.constructor.name)

  // append svg for drawing
  divs.append("svg")
    .attr("class", "graph-view")
    .attr("width", width)
    .attr("height", width)
    .style("border-style", "solid")

  // append ui for setting variables
  divs.each(function(algo) {
    let variableSettings = div()
    if (algo instanceof Eades)
      variableSettings = eadesUI(algo)
    else if (algo instanceof HarelKoren)
      variableSettings = harelKorenUI(algo)
    else if (algo instanceof FruchReingold)
      variableSettings = fruchReinUI(algo)
    else if (algo instanceof ForceAtlas2)
      variableSettings = forceAtlas2UI(algo)

    variableSettings.style.height = '100px'
    variableSettings.style.overflowY = "scroll"
    this.appendChild(variableSettings)
  })
      
  drawGraphs()
}

function drawGraphs() {
  d3.selectAll(".graph-view")
    .each(function(d) {
      draw(d.graph, d3.select(this))
    })

  updateBrushes()
}

function allDone() {
  let data = d3.selectAll(".graph-view").data()
  return data.every(algo => algo.finished)
}

async function stepSimulation() {
  let steps = []
  d3.selectAll(".graph-view")
    .each(d => !d.finished && (steps.push(d.step()), d.finished && console.log(d.constructor.name, "finished")))
  
  await Promise.all(steps)
  drawGraphs()

  if (allDone()) {
    //drawGraphs()
    console.log("all done")
    running = false
    updateBtns()
  }
}

function resumeSimulation() {
  if (running == false) return
  stepSimulation().then(() => requestAnimationFrame(resumeSimulation))
  //requestAnimationFrame(resumeSimulation)
}

function startSimulation() {
  running = true
  resumeSimulation()
  updateBtns()
}

function stopSimulation() {
  running = false
  updateBtns()
}

function updateBtns() {
  if (allDone() || running) {
    stepBtn.disabled = true
    playBtn.disabled = true
  } else {
    stepBtn.disabled = false
    playBtn.disabled = false
  }
  
  stopBtn.disabled = !running
}

function reset() {
  stopSimulation()
  resetAlgos()
  mkSvgs()
  updateBtns()
}

/* function remake() {
  stopSimulation()
  mkSvgs()
  updateBtns()
} */

function resetAlgos() {
  data.forEach(algo => algo.reset())
  drawGraphs()
}

document.body.prepend(graphMakerUI())

const playBtn = document.getElementById("play-button")
playBtn.addEventListener("click", startSimulation)

const stepBtn = document.getElementById("step-button")
stepBtn.addEventListener("click", stepSimulation)

const stopBtn = document.getElementById("stop-button")
stopBtn.addEventListener("click", stopSimulation)

const resetBtn = document.getElementById("reset-button")
resetBtn.addEventListener("click", reset)


const toggleLabelsBtn = document.getElementById("label-button")
toggleLabelsBtn.addEventListener("click", () => {
  showLabels=!showLabels
  drawGraphs()
})

const heatBtn = document.getElementById("heat-button")
heatBtn.addEventListener("click", () => {
  heatedColors = !heatedColors
  drawGraphs()
})

const algos = [Eades,FruchReingold,KamadaKawai,HarelKoren,ForceAtlas2,Gansner]
//const selectedAlgos = [Eades] // algorithms to display

function addAlgo(algo) {
  data.push(new algo(baseGraph.copy()))
}

// construct buttons for each algorithm
for (const algo of algos) {
  let btn = document.createElement("button")
  btn.innerText = algo.name
  let enabled = data.find(algorithm => algorithm instanceof algo) != undefined
  btn.style.backgroundColor = enabled ? 'lime' : 'pink'

  // left clicking adds an algorithm
  btn.onclick = () => {
    addAlgo(algo)
    btn.style.backgroundColor = 'lime'
    reset()
  }

  // right clicking removes an algorithm
  btn.oncontextmenu = (e) => {
    e.preventDefault()
    const idx = data.findIndex(algorithm => algorithm instanceof algo)
    if (idx != -1) data.splice(idx,1)
    if (data.findIndex(algorithm => algorithm instanceof algo) == -1) btn.style.backgroundColor = 'pink'
    reset()
  }
  document.getElementById("algo-buttons").appendChild(btn)
}

initGraph(randomGraph(30, 30, 0.1))



