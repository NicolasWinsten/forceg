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


class ForceAtlas2 extends Algo {
  
 constructor(graph) {
  super(graph)
  this.gg = new graphology.UndirectedGraph()
  this.nodes.forEach(n => {
    this.gg.addNode(n.label, n.pos)
  })

  this.edges.forEach(([u,v]) => this.gg.addEdge(u,v))

  this.worker = new graphologyLibrary.FA2Layout(this.gg, {
    iterations: 1000
  })
 }

  async step() {
    this.worker.start()

    await new Promise(resolve => {
      setTimeout(() => {
        this.worker.stop()
        this.gg.forEachNode((n,attrs) => this.graph.node(n).pos = vec(attrs.x,attrs.y))
        resolve()
      }, 1)
    })
  }
}