let running = false

// draw a graph in the given svg
function draw(graph, svg) {
  const nodes = graph.nodeList().map(n => n.pos)
  const edges = graph.edgeList()

  // fit the svg for the graph
  const [[minX, maxX], [minY, maxY]] = graph.getBounds()
  const width = maxX-minX
  const height = maxY-minY
  
  // size nodes/edgestroke based on how wide the graph is
  const nodeRadius = Math.sqrt((width*height)/(nodes.length*Math.PI))/10
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
      const {x:x1, y:y1} = nodes[node1]
      const {x:x2, y:y2} = nodes[node2]
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
    .attr("cx", node => node.x)
    .attr("cy", node => node.y)
    .attr("r", nodeRadius)
    .attr("fill", "rgb(123, 31, 162)")
    .raise()

  let i = 0 // change node label to show node label
  svg.selectAll(".label")
    .data(nodes)
    .join("text")
    .attr("class", "label")
    .text(() => i++)
    .attr("x", node => node.x)
    .attr("y", node => node.y+nodeRadius*0.8)
    .style("text-anchor", "middle")
    .style("font-size", nodeRadius*2)
    .style("fill", "#ffffff")
    .on("click", console.log)
    .raise()

}

const nSlider = document.getElementById("n-slider")
let N = parseInt(nSlider.value)

nSlider.addEventListener('input', () => {
  document.getElementById("n-label").innerText = `Number of vertices: ${nSlider.value}`
})

nSlider.addEventListener('change', () => {
  N = parseInt(nSlider.value)
  reset()
})

/**
 * 
 * @returns initial graph based on settings
 */
function initGraph() {
  let g = randomGraph(N, N+N, 0.001, "myseed")
  g.computeDistances()
  return g
}

/**
 * 
 * @returns list of algorithms to run
 */
function mkAlgos() {
  let algos = [HarelKoren,KamadaKawai]
  let g = initGraph()
  let data = algos.map(algo => new algo(g.copy()))
  return data
}


/**
 * Construct an SVG for each algorithm
 */
function mkSvgs() {
  let width = 300

  let data = mkAlgos()
  
  d3.select("body")
    .selectAll(".algo-div")
    .data(data)
    .join(
      enter => {
        let div = enter.append("div")
          .attr("class", "algo-div")
          .style("display", "inline-block")
        div.append("h3").attr("class", "algo-label")
          .text(d=>d.constructor.name)
        div.append("svg")
        .attr("class", "graph-view")
        .attr("width", width)
        .attr("height", width)
        .style("border-style", "solid")
        return div
      },
      update => update.each(function(algo) {
          d3.select(this).select(".graph-view").data(algo)
          d3.select(this).select(".algo-label").data(algo)
      }),
      exit => exit.remove()
    )
    .attr("class", "algo-div")

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

function stepSimulation() {
  d3.selectAll(".graph-view")
    .each(d => !d.finished && (d.step(), d.finished && console.log(d.constructor.name, "finished")))
  
  drawGraphs()

  if (allDone()) {
    console.log("all done")
    running = false
    updateBtns()
  }
}

function resumeSimulation() {
  if (running == false) return
  stepSimulation()
  requestAnimationFrame(resumeSimulation)
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
  mkSvgs()
  updateBtns()
}

const playBtn = document.getElementById("play-button")
playBtn.addEventListener("click", startSimulation)

const stepBtn = document.getElementById("step-button")
stepBtn.addEventListener("click", stepSimulation)

const stopBtn = document.getElementById("stop-button")
stopBtn.addEventListener("click", stopSimulation)

const resetBtn = document.getElementById("reset-button")
resetBtn.addEventListener("click", reset)

reset()

