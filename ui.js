// i sincerely need to learn some ui library

function div() {
  return document.createElement("div")
}

function mkSlider(label, range, value, onchange, type="float", exp=1) {
  let slider = document.createElement("input")
  slider.setAttribute("type", "range")
  slider.setAttribute("min", "1")
  slider.setAttribute("max", "100")

  let scale_ = d3.scalePow()
    .exponent(exp)
    .domain([1,100])
    .range(range)
  
  let scale
  if (type === "int")
    scale = val => Math.floor(scale_(val))
  else scale = scale_

  let container = div()
  let labelEl = document.createElement("label")

  let getValue = () => scale(slider.value)

  slider.oninput = () => {
    let val = type === "float" ? getValue().toFixed(3) : getValue()
    labelEl.innerText = `${label} ${val}`
  }

  container.appendChild(labelEl)
  container.appendChild(document.createElement("br"))
  container.appendChild(slider)

  slider.onchange = () => onchange(getValue())
  slider.value = scale_.invert(value)
  labelEl.innerText = `${label} ${value}`

  slider.style.width = '95%'

  return container
}

function mkRadio(labels, name, onchange) {
  let container = div()
  labels.forEach((label,i) => {
    let labelEl = document.createElement("label")
    labelEl.innerText = label

    let radio = document.createElement("input")
    radio.setAttribute("type", "radio")
    radio.setAttribute("name", name)
    radio.setAttribute("value", label)
    if (i == 0) radio.toggleAttribute("checked", true)
    radio.onchange = () => onchange(radio.value)

    let div_ = div()
    div_.appendChild(radio)
    div_.appendChild(labelEl)
    container.appendChild(div_)
  })

  return container
}

function eadesUI(eades) {
  let container = div()
  let elements = [
    mkSlider("dampening", [0,0.5], eades.dampening, x => eades.dampening = x),
    mkSlider("spring length", [0, 10], eades.springLength, x => eades.springLength = x),
    mkSlider("charge", [1, 100], eades.charge, x => eades.charge = x),
    mkSlider("max force", [0, eades.maxForce*2], eades.maxForce, x => eades.maxForce = x),
  ]
  elements.forEach(e => container.appendChild(e))
  return container
}

function harelKorenUI(hk) {
  let container = div()
  let elements = [
    mkSlider("neighborhood radius", [1,30], hk.localRadius, x => hk.localRadius = x, "int"),
    mkSlider("rounds", [1,10], hk.iterations, x => hk.iterations = x, "int"),
    mkSlider("coarsening rate", [2, 10], hk.coarseRate, x => hk.coarseRate = x, "int"),
  ]
  elements.forEach(e => container.appendChild(e))
  return container
}

function fruchReinUI(fr) {
  let container = div()
  let elements = [
    mkSlider("k", [1, 1000], fr.k, x => fr.k = x),
    mkSlider("max force", [0, fr.maxForce*2], fr.maxForce, x => fr.maxForce = x),
    mkSlider("cool factor", [0.95, 0.999], fr.cool, x => fr.cool = x),
  ]
  elements.forEach(e => container.appendChild(e))
  return container
}

function randomGraphUI() {
  let num = 30
  let density = 0.1

  let mkGraph = () => initGraph(randomGraph(num, num, density))

  let container = div()
  let elements = [
    mkSlider("num vertices", [3, 2000], num, x => (num = x, mkGraph()), "int"),
    mkSlider("density", [0, 1], density, x => (density = x, mkGraph()), "float", 3),
  ]
  elements.forEach(e => container.appendChild(e))
  return {
    element: container, mkGraph: mkGraph
  }
}

function gridGraphUI() {
  let width = 8
  let height = 12
  let density = 1
  let form = ""

  let mkGraph = () => initGraph(gridGraph(width,height,density,form))

  let container = div()
  let elements = [
    mkSlider("width", [2, 50], width, x => (width = x, mkGraph()), "int"),
    mkSlider("height", [2, 50], height, x => (height = x, mkGraph()), "int"),
    mkSlider("density", [0, 1], density, x => (density = x, mkGraph()), "float", 3),
    mkRadio(["flat", "torus", "folded"], "shape", x => (form = x, mkGraph()))
  ]
  elements.forEach(e => container.appendChild(e))
  return {
    element: container, mkGraph: mkGraph
  }
}

function treeGraphUI() {
  let degree = 2
  let depth = 6

  let mkGraph = () => initGraph(tree(degree, depth))

  let container = div()
  let elements = [
    mkSlider("degree", [1, 5], degree, x => (degree = x, mkGraph()), "int"),
    mkSlider("depth", [1, 8], depth, x => (depth = x, mkGraph()), "int"),
  ]
  elements.forEach(e => container.appendChild(e))
  return {
    element: container, mkGraph: mkGraph
  }
}

function clusterGraphUI() {
  let num = 13
  let size = 6
  let connectedness = 3

  let mkGraph = () => initGraph(clusterGraph(num,size,connectedness))

  let container = div()
  let elements = [
    mkSlider("num", [1, 30], num, x => (num = x, mkGraph()), "int"),
    mkSlider("size", [1, 30], size, x => (size = x, mkGraph()), "int"),
    mkSlider("connectedness", [0, 20], connectedness, x => (connectedness = x, mkGraph()), "int"),
  ]
  elements.forEach(e => container.appendChild(e))
  return {
    element: container, mkGraph: mkGraph
  }
}

function graphMakerUI() {

  let els = ({"random":randomGraphUI(), "mesh":gridGraphUI(), "tree":treeGraphUI(), "clustered":clusterGraphUI()})
  Object.values(els).forEach(e => e.element.style.display = "none")
  els["random"].element.style.display = "block"

  let container = document.createElement("fieldset")
  let legend = document.createElement("legend")
  legend.innerText = "graph options"
  container.appendChild(legend)
  Object.values(els).forEach(e => container.appendChild(e.element))

  let radio = mkRadio(["random", "mesh", "tree", "clustered"], "graphtype", type => {
    Object.values(els).forEach(e => e.element.style.display = "none")
    els[type].element.style.display = "block"
    els[type].mkGraph()
  })

  container.appendChild(document.createElement("hr"))
  container.appendChild(radio)
  return container
}