/**
 * Move the node positions of the graph according to calculated forces
 * @param {Graph} graph 
 * @param {function} nodePairForce function from a node pair to the force between them  
 * @param {number} maxForce maximum force magnitude that can be applied 
 */
function applyForces(graph, nodePairForce, maxForce) {
  const nodes = graph.nodeList()
  const forces = {}
  nodes.forEach(n => forces[n.label] = vec(0,0))


  for (let i = 0; i < graph.size; i++)
  for (let j = i+1; j < graph.size; j++) {
    const n1 = nodes[i]
    const n2 = nodes[j]
    const f = nodePairForce(n1,n2)
    forces[n1.label] = add(forces[n1.label], f)
    forces[n2.label] = subtract(forces[n2.label], f)
  }

  // apply forces to node positions
  for (const node of nodes) {
    let f = forces[node.label]

    const mag = magnitude(f)
    if (mag > maxForce)
      f = mult(f, maxForce/mag)

    node.pos = add(node.pos, f)
  }

  return forces
}


/**
 * Implementation of Eades spring embedders algorithm.
 * Eades, Peter. “A Heuristic for Graph Drawing.” (1984)
 * 
 * Each edge acts as a spring.
 * Every node pair exhibits a repulsive force
 * 
 */
class Eades {
  static computeRepulsionForce(pos1, pos2, c2) {
    const dist_ = dist(pos1, pos2)
    const repulsion = c2 / (dist_**2)
    const f = mult(subtract(pos1, pos2), repulsion/dist_)
    return f
  }

  static computeSpringForce(pos1, pos2, restLength, dampening) {
    const dist_ = dist(pos1, pos2)
    const delta = dist_ - restLength
    const f = mult(subtract(pos2, pos1), dampening*delta/dist_)
    return f
  }

  constructor(graph) {
    this.graph = graph
    this.dampening = 0.15
    this.springLength = 100
    this.charge = 150*150
    this.charge2 = this.charge**2
    this.maxForce = 100*Math.sqrt(graph.size)
    this.iterations = graph.size*10
    this.finished = false
  }

  nodePairForce(node1,node2) {
    const pos1 = node1.pos
    const pos2 = node2.pos
    if (this.graph.neighbors(node1.label,node2.label))
      return Eades.computeSpringForce(pos1,pos2,this.springLength,this.dampening)
    else
      return Eades.computeRepulsionForce(pos1,pos2,this.charge2)
  }

  step() {
    if (this.finished) throw `Iterator finished`
    applyForces(this.graph, this.nodePairForce.bind(this), this.maxForce)
    this.finished = --this.iterations == 0
  }

}


/**
 * Variant of Fruchterman-Reingold spring embedder
 * 
 * Repulsion force is modeled by electric charge
 * Attractive force is modeled by f = distance**2 / charge
 * 
 * The maximum force applied to a node per iteration decreases linearly
 * 
 * Fruchterman, Thomas MJ, and Edward M. Reingold. "Graph drawing by force‐directed placement." (1991)
 */
class FruchReingold {
  static computeAttractiveForce(pos1, pos2, c) {
    const delta = subtract(pos2, pos1)
    const dist_ = dist(pos1, pos2)
    const attraction = dist_ / c
    return mult(delta, attraction)
  }
  

  constructor(graph) {
    this.graph = graph
    this.charge = 150*150
    this.charge2 = this.charge**2
    this.maxForce = 250 * Math.sqrt(graph.size)
    this.cool = (250 * Math.sqrt(graph.size))/(graph.size*10)
    this.minTemp = 1
    this.iterations = graph.size*10
  }

  nodePairForce(node1,node2) {
    const pos1 = node1.pos
    const pos2 = node2.pos
    const repulsion = Eades.computeRepulsionForce(pos1,pos2,this.charge2)
    if (this.graph.neighbors(node1.label,node2.label))
      return add(repulsion, FruchReingold.computeAttractiveForce(pos1,pos2,this.charge))
    else
      return repulsion
  }

  step() {
    if (this.finished) throw `Iterator finished`
    applyForces(this.graph, this.nodePairForce.bind(this), this.maxForce)
    this.maxForce -= this.cool
    this.maxForce = Math.max(this.maxForce, this.minTemp)
    this.finished = --this.iterations == 0
  }
}


