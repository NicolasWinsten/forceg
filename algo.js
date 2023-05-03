class Algo {

  constructor(graph) {
    this.setGraph(graph)
  }

  step() {
    throw `Not implemented`
  }

  reset() {
    this.nodes.forEach(n => n.pos = {...this.initialLayout[n.label]})
    this.finished = false
  }

  setGraph(graph) {
    this.graph = graph
    this.nodes = graph.nodeList()
    this.edges = graph.edgeList()
    this.finished = false

    this.initialLayout = {}
    this.nodes.forEach(n => this.initialLayout[n.label] = {...n.pos})
  }
}

/**
 * Jacomy, Mathieu, et al. "ForceAtlas2, a continuous graph layout
 * algorithm for handy network visualization designed for the Gephi
 * software." PloS one 9.6 (2014): e98679.
 */
class ForceAtlas2 extends Algo {
  
 constructor(graph) {
  super(graph)
 }

  async step() {
    this.layout.step()
    this.gg.forEachNode((n,attrs) => this.graph.node(n).pos = vec(attrs.x,attrs.y))
  }

  mkGraphologyInstance() {
    // copy the graph into a graphology instance to get access to forceAtlas2 layout implementation
    // this.gg = new graphology.UndirectedGraph()
    // this.nodes.forEach(n => {
    //   this.gg.addNode(n.label, n.pos)
    // })
    // this.edges.forEach(([u,v]) => this.gg.addEdge(u,v))
    this.gg = this.graph.toGraphology()
  }

  mkIterator() {
    this.layout = graphologyLibrary.layoutForceAtlas2(this.gg, {settings:this.settings})
    this.settings = this.layout.settings
  }

  inferSettings() {
    this.settings = graphologyLibrary.layoutForceAtlas2.inferSettings(this.gg)
  }

  reset() {
    super.reset()
    this.mkGraphologyInstance()
    this.mkIterator()
  }

  setGraph(graph) {
    super.setGraph(graph)
    this.mkGraphologyInstance()
    this.inferSettings()
    this.mkIterator()
  }

  get linLogMode() { return this.settings.linLogMode }
  get gravity() { return this.settings.gravity }
  get strongGravityMode() { return this.settings.strongGravityMode }

  set linLogMode(enabled) { this.settings.linLogMode = enabled }
  set gravity(g) { this.settings.gravity = g }
  set strongGravityMode(enabled) { this.settings.strongGravityMode = enabled}

}

/**
 * Gansner, Emden R., Yehuda Koren, and Stephen North. "Graph drawing by stress majorization."
 * Graph Drawing: 12th International Symposium, GD 2004, New York, NY, USA
 */
class Gansner extends Algo {

  computeNewPosition(node) {
    let weightSum = 0
    let xDisp = 0
    let yDisp = 0
    
    for (const otherNode of this.nodes)
    if (node != otherNode) {
      const gtd = this.graph.dist(node.label, otherNode.label)
      const weight = 1/(gtd**2)
      weightSum += weight

      const dist_ = dist(node.pos, otherNode.pos)

      xDisp += weight * (otherNode.pos.x + gtd*(node.pos.x-otherNode.pos.x)/dist_)
      yDisp += weight * (otherNode.pos.y + gtd*(node.pos.y-otherNode.pos.y)/dist_)
    }

    node.pos = vec(xDisp/weightSum, yDisp/weightSum)
  }

  step() {
    this.nodes.forEach(node => this.computeNewPosition(node))
  }
}