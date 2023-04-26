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