let running = false

let data = []

let baseGraph = undefined

// draw a graph in the given svg
function draw(graph, svg) {
  const nodes = graph.nodeList()
  const edges = graph.edgeList()

  // fit the svg for the graph
  const [[minX, maxX], [minY, maxY]] = graph.getBounds()
  const width = maxX-minX
  const height = maxY-minY
  
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
    .attr("stroke", "black")
    .attr("stroke-width", edgeThickness)

    // draw a circle for each node
  
  svg.selectAll(".node")
    .data(nodes)
    .join("circle")
    .attr("class", "node")
    .attr("cx", node => node.pos.x)
    .attr("cy", node => node.pos.y)
    .attr("r", node => node.highlight ? nodeRadius*3: nodeRadius)
    .attr("fill", "rgb(123, 31, 162)")
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
    .style("font-size", node => node.highlight ? nodeRadius*6 : nodeRadius*2)
    .style("fill", "#ffffff")
    .on("click", (_,n) => console.log(n))
    .raise()

}

/**
 * 
 * @returns initial graph based on settings
 */
function initGraph(graph) {
  stopSimulation()

  baseGraph = graph
  assignRandomLayout(baseGraph)
  baseGraph.computeDistances()
  data.forEach(algo => (algo.setGraph(baseGraph.copy()), algo.reset()))

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

let showLabels = false
const toggleLabelsBtn = document.getElementById("label-button")
toggleLabelsBtn.addEventListener("click", ()=>showLabels=!showLabels)

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



