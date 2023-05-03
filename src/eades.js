/**
 * Move the node positions of the graph according to calculated forces
 * @param {Graph} graph 
 * @param {function} nodePairForce function from a node pair to the force between them  
 * @param {number} maxForce maximum force magnitude that can be applied 
 */
function applyForces(particles, nodePairForce, maxForce) {
  const forces = {}
  particles.forEach(n => forces[n.label] = vec(0,0))

  particles.forEachPair((n1,n2) => {
    let f = nodePairForce(n1,n2)
    //let f_ = nodePairForce(n2,n1)

    //updateParticle(n1,f,dt)
    //updateParticle(n2,mult(f,-1),dt)

    forces[n1.label] = add(forces[n1.label], f)
    forces[n2.label] = subtract(forces[n2.label], f)
  })

  particles.forEach(n => {
    let f = forces[n.label]

    //f = subtract(f, mult(n.vel, 0.05*magnitude(n.vel)**2))
    // clamp force
    const mag = magnitude(f)
    if (mag > maxForce)
      f = mult(f, maxForce/mag)


    // updateParticle(n,f,dt)
    n.pos = add(n.pos, f)
  })
}


/**
 * Implementation of Eades spring embedders algorithm.
 * Eades, Peter. “A Heuristic for Graph Drawing.” (1984)
 * 
 * Each edge acts as a spring.
 * Every node pair exhibits a repulsive force
 * 
 */
class Eades extends Algo {
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
    super(graph)
    this.dampening = 0.06
    this.springLength = 1
    this.charge = 5
    this.maxForce = 100
  }

  nodePairForce(node1,node2) {
    const pos1 = node1.pos
    const pos2 = node2.pos
    if (this.graph.neighbors(node1.label,node2.label))
      return Eades.computeSpringForce(pos1,pos2,this.springLength,this.dampening)
    else
      return Eades.computeRepulsionForce(pos1,pos2,this.charge**2)
  }

  async step() {
    applyForces(this.nodes, this.nodePairForce.bind(this), this.maxForce)
  }

  reset() {
    super.reset()
  }

  setGraph(graph) {
    super.setGraph(graph)
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
class FruchReingold extends Algo {
  computeAttractiveForce(pos1, pos2) {
    const delta = subtract(pos2, pos1)
    const dist_ = dist(pos1, pos2)
    const attraction = dist_ / this.k
    return mult(delta, attraction)
  }

  computeRepulsionForce(pos1,pos2) {
    const delta = subtract(pos1, pos2)
    const dist_ = magnitude(delta)
    const force = this.temp*this.k*this.k / dist_**2
    return mult(delta,force)
  }
  

  constructor(graph) {
    super(graph)
    this.k = 100
    this.maxForce = 250
    this.temp = this.maxForce
    this.cool = 0.99
    this.minTemp = Math.sqrt(graph.size)
  }

  nodePairForce(node1,node2) {
    const pos1 = node1.pos
    const pos2 = node2.pos
    let force = this.computeRepulsionForce(pos1,pos2)
    if (this.graph.neighbors(node1.label,node2.label))
      force = add(force, this.computeAttractiveForce(pos1,pos2))

    return force // todo add speed modifier
  }

  async step() {
    applyForces(this.nodes, this.nodePairForce.bind(this), this.temp)
    this.temp *= this.cool
    this.temp = Math.max(this.temp, this.minTemp)
  }

  reset() {
    super.reset()
    this.temp = this.maxForce
  }

  setGraph(graph) {
    super.setGraph(graph)
    // this.maxForce = 200 * Math.sqrt(graph.size)
    this.minTemp = Math.sqrt(graph.size)
  }
}

