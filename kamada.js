
/**
 * The KamadaKawai approach is also a spring embedding.
 * Each node pair in the model is assigned a spring whose strength corresponds to the graph theoretic distance of the pair
 * 
 * Iteratively, the node with the most potential energy in the spring model is pushed to a lower energy state
 * until the model's energy reduces to some threshold
 * 
 * Kamada, Tomihisa, and Satoru Kawai. "An algorithm for drawing general undirected graphs." (1989)
 */
class KamadaKawai {
  // calculate a spring for each node pair based on graph theoretic distance
  // return a matrix m such that m[i][j] = {strength,length} of the spring between nodes i,j
  modelSprings() {
    const nodeLabels = this.nodes.map(n=>n.label)

    let springs = matrix(nodeLabels, (i,j) => {
      if (i == j) return {strength:0,length:0}

      const graphTheoreticDistance = this.graph.dist(i,j)
      const length = graphTheoreticDistance
      const strength = 1/ (graphTheoreticDistance**2)

      return {strength:strength, length:length}
    })

    return springs
  }

  // model a spring between the given node and all other nodes
  // the force applied by the spring corresponds to graph theoretic distances
  computeEnergy(node) {
    let f = vec(0,0)
    
    for (const otherNode of this.nodes)
    if (this.discriminator(node, otherNode)) {
      if (otherNode == node) continue
      const otherPos = otherNode.pos
      const springLength = this.springs[otherNode.label][node.label].length
      const springStrength = this.springs[otherNode.label][node.label].strength
      
      const delta = subtract(node.pos, otherPos)
      const spaceDistance = magnitude(delta)

      f = add(f, mult(delta, springStrength * (1 - springLength/spaceDistance)))
    }

    return magnitude(f)
  }

  // return {node,energy} of the node with the highest potential energy in the spring model
  highestEnergyVertex() {
    if (this.graph.size == 0) throw "Graph is empty"

    let energies = this.nodes.map(n => this.computeEnergy(n))
    const maxE = energies.reduce((x,y) => Math.max(x,y))
    const node = this.nodes[energies.indexOf(maxE)]
    
    return {node:node, energy:maxE}
  }

  // something to do with solving linear equations
  computeNextPosition(node) {
    let xe = 0
    let ye = 0
    let xxe = 0
    let xye = 0
    let yye = 0
    
    for (const otherNode of this.nodes)
    if (this.discriminator(node,otherNode)) {
      if (otherNode == node) continue

      const delta = subtract(node.pos, otherNode.pos)
      const space = magnitude(delta)
      const springLength = this.springs[node.label][otherNode.label].length
      const springStrength = this.springs[node.label][otherNode.label].strength

      xe += delta.x*springStrength*(1-springLength/space)
      ye += delta.y*springStrength*(1-springLength/space)
      xye += springStrength*springLength*delta.x*delta.y / space**3
      xxe += springStrength*(1 - springLength*delta.y*delta.y / space**3)
      yye += springStrength*(1 - springLength*delta.x*delta.x / space**3)
    }

    const denom = xxe*yye - xye**2 // TODO this could be zero if no nodes are examined
    node.pos.x += (xye*ye - yye*xe) / denom
    node.pos.y += (xye*xe - xxe*ye) / denom
  }

  moveNode(node) {
    let iters = 0
    while (true) {
      this.computeNextPosition(node)
      let e = this.computeEnergy(node)
      if (e <= this.energyThreshold || iters++ >= this.maxVertexIters) break
    }
  }

  constructor(graph) {
    this.graph = graph
    this.nodes = graph.nodeList()
    this.energyThreshold = 1e-5
    this.stableThreshold = 1e-2
    this.stableCount = 0
    this.stableCountThreshold = 5
    this.previousMaxEnergy = Number.MAX_VALUE
    this.maxVertexIters = 10 // maximum number of iterations to refine layout of one node
    //this.k = 10000
    this.springs = this.modelSprings()
    this.discriminator = (u,v)=>true  // function to determine if node v should be considered when computing the energy of node u
    this.finished = false
  }

  // find the node with the most potential energy and reduce its energy
  // by moving its position
  step() {
    if (this.finished) throw `KamadaKawaii refinement finished`

    let {node:maxEnergyNode,energy:maxEnergy} = this.highestEnergyVertex()
    // find the highest energy vertex    

    if (Math.abs(maxEnergy - this.previousMaxEnergy) < this.stableThreshold) this.stableCount++
    else this.stableCount = 0

    if (maxEnergy <= this.energyThreshold || this.stableCount >= this.stableCountThreshold) this.finished = true

    this.moveNode(maxEnergyNode)

    this.previousMaxEnergy = maxEnergy
  }
  
}