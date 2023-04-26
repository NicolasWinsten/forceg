
/**
 * Multi-scale graph layout algorithm
 * 
 * HarelKoren algorithm uses the KamadaKawai amended with a multi-stage scheme.
 * For each stage, nodes are collapsed into supernodes and the KamadaKawai heuristic is applied to
 * the resulting supergraph. For each subsequent stage, the number of supernodes grows geometrically
 * until the supergraph degenerates into the original graph.
 * 
 * Harel, D., & Koren, Y. (2000, May). A fast multi-scale method for drawing large graphs.
 */
class HarelKoren extends Algo {

  constructor(graph) {
    super(graph)
    this.localRadius = 7  // radius of local neighborhoods
    this.iterations = 5   // iterations to run the local layout refiner on each stage
    this.coarseRate = 3   // ratio of supernodes between each stage
    this.minGranularity = Math.min(10, graph.size) // initial number of supernodes
    this.numSuperNodes = this.minGranularity // current number of supernodes
    this.finished = false
    this.kamada = new KamadaKawai(this.graph)
    this.noise = 0.1
    //this.kamada.energyThreshold = 5000

    this.stepper = this.newPhase()
  }

  // construct a closure for the next current phase
  newPhase() {
    // choose the supernodes
    const lastPhase = this.numSuperNodes == this.graph.size
    let centers
    let radius
    if (lastPhase) {
      centers = this.nodes
      radius = this.localRadius
    } else {
      centers = kcenters(this.graph, this.numSuperNodes)
      // find the center with the largest minimum distance to another center
      // multiply it by the base radius to determine the size of the supernode's neighborhood for the phase
      radius = centers
        .map(u => centers.filter(v => u!=v).map(v => this.graph.dist(u.label,v.label)).minBy(x=>x))
        .maxBy(x=>x)*this.localRadius
      
      // highlight the supernodes for drawing
      centers.forEach(c => c.highlight = true)
    }
    
    let shareNeighborhood = (u,v) => this.graph.dist(u.label,v.label) <= radius

    // map centers to the other centers in their neighborhood
    const neighborhoods = {}
    centers.forEach(c => neighborhoods[c.label] = centers.filter(u => shareNeighborhood(c,u)))

    const centerSet = new Set(centers)
    // only consider the other nearby centers when computing energy of a center
    this.kamada.discriminator = (u,v) => centerSet.has(v) && shareNeighborhood(u,v)

    // create a priority queue to track the high energy nodes
    const q = new PriorityQueue()
    centers.forEach(c => c.qid = q.enqueue(c, -this.kamada.computeEnergy(c)))

    let i = this.numSuperNodes*this.iterations
    const iterator = () => {
      // use kamada kawai heuristic to improve the position of the given list of nodes.
      // compute kamada energy function only using the given list of nodes and for only a local neighborhood within some radius
      //const maximalLocalEnergyNode = centers.maxBy(u => this.kamada.computeEnergy(u)) // TODO implement this part with priority queue
      const maximalLocalEnergyNode = q.top()
      // TODO end this stage if the maxenergy is below threshold
      const energy = q.topPriority()
      //if (Math.abs(energy) < this.kamada.energyThreshold) return false

      this.kamada.moveNode(maximalLocalEnergyNode)

      neighborhoods[maximalLocalEnergyNode.label].forEach(c => q.updatePriority(c.qid, -this.kamada.computeEnergy(c)))
      // update priority queue

      if (--i <= 0) { // if the phase has ended
        // move every node to its corresponding supernode
        if (!lastPhase) {
          for (const v of this.nodes)
          if (!centerSet.has(v)) {
            v.pos = centers.minBy(c => this.graph.dist(c.label,v.label)).pos
            v.pos = add(v.pos, randomPosition(this.noise))
          } else {
            v.highlight = false
          }
        }
        return false // false means phase is finished
      } else return true
    }

    return iterator
  }

  step() {
    let isPhaseFinished = !this.stepper()
    if (isPhaseFinished) {
      if (this.numSuperNodes == this.graph.size) {
        this.finished = true
      }
      else {
        this.numSuperNodes = Math.min(this.graph.size,this.coarseRate*this.numSuperNodes)
        this.stepper = this.newPhase()
      }
    }
  }

  reset() {
    super.reset()
    this.numSuperNodes = this.minGranularity
    this.nodes.forEach(n => n.highlight = false)
    this.stepper = this.newPhase()
  }

  setGraph(graph) {
    super.setGraph(graph)
    this.minGranularity = Math.min(this.minGranularity, graph.size)
    this.kamada = new KamadaKawai(graph)
  }
}