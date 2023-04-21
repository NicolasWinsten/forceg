
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
class HarelKoren {

  // use kamada kawai heuristic to improve the position of the given list of nodes.
  // compute kamada energy function only using the given list of nodes and for only a local neighborhood within some radius
  layoutLocal (centers, radius) {
    let centerSet = new Set(centers)
    // only consider the other nearby centers when computing energy of a center
    this.kamada.discriminator = (u,v) => centerSet.has(v) && this.graph.dist(u.label,v.label) <= radius

    for (let i = 0; i < centers.length*this.iterations; i++) {
      const maximalLocalEnergyNode = centers.maxBy(u => this.kamada.computeEnergy(u))
      this.kamada.moveNode(maximalLocalEnergyNode)
    }
  }

  constructor(graph) {
    this.graph = graph
    this.nodes = this.graph.nodeList()
    this.localRadius = 7  // radius of local neighborhoods
    this.iterations = 5   // iterations to run the local layout refiner on each stage
    this.coarseRate = 3   // ratio of supernodes between each stage
    this.minGranularity = Math.min(10, graph.size) // initial number of supernodes
    this.numSuperNodes = this.minGranularity // current number of supernodes
    this.finished = false
    this.kamada = new KamadaKawai(this.graph)
    this.kamada.energyThreshold = 10
  }

  step() {
    if (this.numSuperNodes == this.graph.size) {
      this.finished = true
    }

    // choose the supernodes
    const centers = kcenters(this.graph, this.numSuperNodes)
    // find the center with the largest minimum distance to another center
    // multiply it by the base radius to determine the size of the supernode's neighborhood
    const radius = centers
      .map(u => centers.filter(v => u!=v).map(v => this.graph.dist(u.label,v.label)).minBy(x=>x))
      .maxBy(x=>x)*this.localRadius

    // use KamadaKawai heuristic to compute good positions for supernodes
    this.layoutLocal(centers, radius)

    let centerSet = new Set(centers)
    // move every node to its corresponding supernode
    if (this.numSuperNodes != this.graph.size) {
      for (const v of this.nodes)
      if (!centerSet.has(v)) {
        v.pos = centers.minBy(c => this.graph.dist(c.label,v.label)).pos
        v.pos = add(v.pos, randomPosition(10))
      }
    }
    
    this.numSuperNodes = Math.min(this.graph.size,this.coarseRate*this.numSuperNodes)
  }
}