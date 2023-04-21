
/**
 * Undirected graph
 */
class Graph {
  #nodes = {} // mapping of node labels to node objects
  #edges = [] 
  #neighbors = {} // mapping of node labels to set of node labels (their neighbors)
  #shortestPathsComputed = false
  #dist

  // todo make graph.nodes an object mapping labels to nodes
  constructor(n=0) {
    this.size = 0
    for (let i = 0; i < n; i++) this.addNode(i)
  }

  addEdge(a,b) {
    if (this.neighbors(a,b))
      throw `${a},${b} are already connected`
    this.#edges.push([a,b])
    this.#neighbors[a].add(b)
    this.#neighbors[b].add(a)
    this.#shortestPathsComputed = false
  }

  neighbors(a,b) {
    return this.#neighbors[a].has(b)
  }

  neighborsOf(a) {
    return this.#neighbors[a]
  }

  addNode(label) {
    let node =  {
      label: label,
      pos: vec(0,0)
    }
    this.#insertNode(node)
  }

  #insertNode(node) {
    if (this.#nodes[node.label]) throw `node labeled ${label} already exists`
    this.#neighbors[node.label] = new Set()
    this.#nodes[node.label] = node
    this.size++
    this.#shortestPathsComputed = false
  }

  node(label) {
    return this.#nodes[label]
  }

  nodeList() {
    return Object.values(this.#nodes)
  }

  edgeList() {
    return this.#edges
  }

  copy() {
    let newGraph = new Graph(0)

    for (const node of this.nodeList()) {
      newGraph.addNode(node.label)
      newGraph.#nodes[node.label].pos = vec(node.pos.x, node.pos.y)
    }
    
    for (const [u,v] of this.#edges)
      newGraph.addEdge(u,v)

    newGraph.#dist = this.#dist
    newGraph.#shortestPathsComputed = this.#shortestPathsComputed

    return newGraph
  }

  /**
   * 
   * @param {*} u node label
   * @param {*} v node label
   * @return {boolean} true if v is reachable from u 
   */
/*   reaches(u,v) {
    const visited = new Set()

    let search = (curNode) => {
      if (curNode == v) return true
      visited.add(curNode)
      for (const neighbor of this.neighborsOf(curNode))
      if (!visited.has(neighbor))
      if (search(neighbor)) return true
      return false
    }

    return search(u)
  } */

  // return the number of edge crossings in this graph's layout
  edgeCrossings() {
    let crossings = 0
    for (let i = 0; i < this.#edges.length; i++)
    for (let j = i+1; j < this.#edges.length; j++) {
      const [u,v] = this.#edges[i]
      const [w,z] = this.#edges[j]
      // adjacent edges cannot cross in straight line graph
      if (u == w || u == z || v == w || v == z) continue

      const [p1,p2,p3,p4] = [u,v,w,z].map(label => this.#nodes[label].pos)
      crossings += intersects(p1,p2,p3,p4)
    }
    return crossings
  }

  computeDistances() {
    this.#dist = shortestPaths(this)
    this.#shortestPathsComputed = true
  }

  /**
   * 
   * @param {*} u node label
   * @param {*} v node label
   * @returns graph theoretic distance between nodes
   */
  dist(u,v) {
    if (!this.#shortestPathsComputed) this.computeDistances()
    return this.#dist[u][v]
  }

  // return the spatial bounds of a graph: [[minX, maxX],[minY,maxY]]
  getBounds() {
    let nodes = this.nodeList()
    return [d3.extent(nodes, n=>n.pos.x), d3.extent(nodes, n=>n.pos.y)]
  }

}

/**
 * 
 * @param {number | number[][]} sizeOrEdgeList list of edges [x,y] where labels x,y < number of nodes
 *  (or provide the number of nodes and generate random edges)
 * @param {number} width spatial width of area to place nodes in 
 * @param {number} density value 0 to 1 corresponding to the completeness of the generated edges
 * @returns {Graph} graph
 */
function randomGraph(sizeOrEdgeList, width, density, seed) {
  if (typeof sizeOrEdgeList === "number") {
    const size = sizeOrEdgeList

    let rng = new Math.seedrandom(seed)    
    let getRandomNode = () => Math.floor(rng()*size)

    // keep a pool of all possible edges to add
    let edgePool = new Set()
    let edgeKey = (u,v) => {
      if (u > v) [v,u] = [u,v]
      return `${u},${v}`
    }
    let removeEdgeFromPool = (u,v) => edgePool.delete(edgeKey(u,v))
    let getRemainingEdges = () => {
      let remEdges = []
      for (const key of edgePool)
        remEdges.push(key.split(",").map(x => parseInt(x)))
      return remEdges
    }

    // fill the pool with all possible node pairs
    for (let i = 0; i < size; i++)
    for (let j = i+1; j < size; j++)
    edgePool.add(edgeKey(i,j))

    let graph = new Graph(size)
    // create a spanning tree by simulating a random walk on a complete graph
    let visitedNodes = new Set()
    let currNode = getRandomNode()
    visitedNodes.add(currNode)
    while (visitedNodes.size < size) {
      let neighborNode = getRandomNode()
      if (!visitedNodes.has(neighborNode)) {
        removeEdgeFromPool(currNode, neighborNode)
        graph.addEdge(currNode, neighborNode)
        visitedNodes.add(neighborNode)
      }
      currNode = neighborNode
    }

    // add in edges randomly until desired edge number is reached
    let numDesiredEdges = d3.scaleLinear().domain([0,1]).range([size-1, size*(size-1)/2])(density)
    let remainingEdges = getRemainingEdges()
    while (graph.edgeList().length < numDesiredEdges) {
      let i = Math.floor(rng()*remainingEdges.length)
      let e = remainingEdges[i]
      graph.addEdge(e[0], e[1])
      remainingEdges.splice(i,1)
    }

    for (let i = 0; i < size; i++) graph.node(i).pos = randomPosition(width, rng)

    return graph
  } else { // edge list is given
    // verify that node labels in the given edge list form range(0,n)
    // TODO allow labels generic and convert them to range
    edges = sizeOrEdgeList
    let labels = [...new Set(edges.flat())].sort()
    for (let i = 0; i < labels.length; i++)
      if (labels[i] != i) throw new Error("Given edge list is malformed")
    
    let graph = new Graph(labels.length)
    for (const [u,v] of edges) {
      graph.addEdge(u,v)
      graph.node(u).pos = randomPosition(width, rng)
      graph.node(v).pos = randomPosition(width, rng)
    }
    return graph
  }
}

// TODO hand code shortest paths for a full grid
function gridGraph(n, density=1, folded=false) {
  const size = n*n
  const fullGrid = new Graph()

  const label = (i,j) => i*n + j
  const layout = (i,j) => vec(i,j)

  for (const i of d3.range(n))
  for (const j of d3.range(n)) {
    const label1 = label(i,j)
    fullGrid.addNode(label1)
    fullGrid.node(label1).pos = layout(i,j)

    if (i > 0) fullGrid.addEdge(label1, label(i-1,j))
    if (j > 0) fullGrid.addEdge(label1, label(i,j-1))
  }

  const nodes = fullGrid.nodeList()
  const sparseGraph = new Graph()
  // initialize graph with random node
  sparseGraph.addNode(randItem(nodes).label)
  let getRandomNode = () => randItem(sparseGraph.nodeList()).label
  while (sparseGraph.size < size) {
    let node = getRandomNode()
    let possibleNeighbors = [...fullGrid.neighborsOf(node)]
      .filter(u => sparseGraph.node(u) === undefined)
    if (possibleNeighbors.length > 0) {
      const newNeighbor = randItem(possibleNeighbors)
      sparseGraph.addNode(newNeighbor)
      sparseGraph.addEdge(node, newNeighbor)
    }
  }

  let numDesiredEdges = Math.floor(
    d3.scaleLinear().domain([0,1]).range([size-1, (n-1)*n*2])(density)
  )
  let numEdges = sparseGraph.size-1
  let edgePool = fullGrid.edgeList().filter(([u,v]) => !sparseGraph.neighbors(u,v))
  while (numEdges < numDesiredEdges) {
    let edge = randItem(edgePool)
    edgePool.splice(edgePool.indexOf(edge), 1)
    sparseGraph.addEdge(...edge)
    numEdges++
  }

  // reassign corrrect layout
  for (const node of sparseGraph.nodeList())
    node.pos = fullGrid.node(node.label).pos

  // if this is a folded mesh then connect opposite corners
  if (folded) {
    sparseGraph.addEdge(label(0,0), label(n-1,n-1))
    sparseGraph.addEdge(label(n-1,0), label(0,n-1))
  }
  

  return sparseGraph
}

function tree(degree, maxDepth) {
  let nodeCount = 0
  const tree = new Graph()

  let mkNodes = (nodeNum, depth) => {
    if (depth >= maxDepth) return
    const node = tree.node(nodeNum)
    
    for (let i = 0; i < degree; i++) {
      const label = ++nodeCount
      tree.addNode(label)
      tree.addEdge(label, node.label)
      tree.node(label).pos = add(node.pos, vec(sample(0,0.5), 1))
      mkNodes(label, depth+1)
    }
  }

  tree.addNode(nodeCount)
  mkNodes(nodeCount, 0)
  return tree
}


/**
 * 
 * @param {Graph} graph graph to layout
 * @param {number} width width of square to randomly place node in
 */
function assignRandomLayout(graph, width) {
  for (const node of graph.nodeList())
    node.pos = randomPosition(width)
}

/**
 * Evenly space the nodes of the graph on a circle
 * @param {Graph} graph 
 * @param {number} radius 
 */
function assignRadialLayout(graph, radius) {
  const nodes = graph.nodeList()
  const sep = 2*Math.PI/nodes.length

  let pos = vec(radius,0)
  for (const node of nodes) {
    node.pos = pos
    pos = rotate(pos, sep)
  }
  console.log("radiual layout")
}

/**
 * Compute shortest distances for unweighted,undirected graph
 * using FloydWarshall
 * @param {Graph} graph 
 * @return matrix m such that m[u][v] is the distance between nodes u and v
 */
function shortestPaths(graph) {
  console.log("computing shortest paths")
  const nodeLabels = graph.nodeList().map(n => n.label)
  // dists[u][v] tracks the distance between u and v
  let dists = matrix(nodeLabels, (u,v) => {
    if (u == v) return 0
    if (graph.neighbors(u,v)) return 1
    return Infinity
  })

  for (const k of nodeLabels)
  for (const i of nodeLabels)
  for (const j of nodeLabels)
  if (dists[i][j] > dists[i][k] + dists[k][j])
    dists[i][j] = dists[i][k] + dists[k][j]

  return dists
}

/**
 * Approximating k centers for the given graph's nodes based on graph theoretic distance
 * 
 * @param {Graph} graph 
 * @param {integer} k number of centers
 * @return k nodes from graph approximating barycenter of clusters
 */
function kcenters(graph, k) {
  const nodes = graph.nodeList()
  const n = nodes.length
  if (n < k) throw `graph is too small for ${k} centers`

  const centers = new Set()
  const firstCenter = nodes[Math.floor(Math.random()*n)]
  centers.add(firstCenter)

  // for some vertex, find its minimum distance to the current centers
  let minDistFromCenters = u => [...centers]
    .map(center => graph.dist(u.label, center.label))
    .minBy(d=>d)

  // repeatedly find a node furthest away from the chosen centers to be a new center
  for (let i = 1; i < k; i++) {
    let furthest = nodes
      .filter(u => !centers.has(u))
      .maxBy(u => minDistFromCenters(u))
    centers.add(furthest)
  }

  return [...centers]
}