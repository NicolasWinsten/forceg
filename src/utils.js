/**
 * utility functions
 */

/**
 * Fill the undefined attributes of the given object according to the default object
 * 
 * useful for objects used to pass parameters
 * 
 * @param {object} obj 
 * @param {object} defaults 
 */
function fillDefaults(obj, defaults) {
  for (prop in defaults)
  if (obj[prop] === undefined)
    obj[prop] = defaults[prop]

  return obj
}

// FUNCTIONS ON {x,y} vectors

function mult(vec, s) {
  return {x: vec.x*s, y: vec.y*s}
}

function add(vec1,vec2) {
  return {x: vec1.x+vec2.x, y: vec1.y+vec2.y}
}

function subtract(vec1,vec2) {
  return {x: vec1.x-vec2.x, y: vec1.y-vec2.y}
}

function magnitude(vec) {
  return Math.sqrt(vec.x**2 + vec.y**2)
}

function vec(x,y) {
  return {x:x, y:y}
}

function dist(vec1, vec2) {
  return Math.sqrt((vec1.x-vec2.x)**2 + (vec1.y-vec2.y)**2)
}

function rotate(v, rad) {
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const x = v.x*cos - v.y*sin
  const y = v.x*sin + v.y*cos
  return vec(x,y)
}

/**
 * 
 * @param {vec} a1 start of segment a 
 * @param {vec} a2 endpoint of segment a
 * @param {vec} b1 start of segment b
 * @param {vec} b2 endpoint of segment b
 * @returns {boolean} true if the segments are intersecting
 */
function intersects(a1,a2,b1,b2) {
  // determine if the 3 given points are laid out in counterclockwise order
  let ccw = (p1,p2,p3) => (p3.y-p1.y)*(p2.x-p1.x) > (p2.y-p1.y)*(p3.x-p1.x)
  
  return ccw(a1,b1,b2) != ccw(a2,b1,b2) && ccw(a1,a2,b1) != ccw(a1,a2,b2)
}


/**
 * 
 * @param {number} m 
 * @param {number} n 
 * @param {any} fill matrix is filled with the given value,
 *  or if fill is a function then matrix[i][j] = fill(i,j) 
 * @returns matrix
 */
function matrix(indices, fill) {
  const rows = {}
  for (const i of indices) {
    rows[i] = {}
    for (const j of indices) {
      if (typeof fill === 'function') rows[i][j] = fill(i,j)
      else rows[i][j] = fill
    }
  }
  return rows
}

function forEachPair(arr, func) {
  for (let i = 0; i < arr.length; i++)
  for (let j = i+1; j < arr.length; j++)
  func(arr[i],arr[j])
}

/**
 * 
 * @param {*[]} arr array
 * @returns random item from the array
 */
function randItem(arr) {
  return arr[Math.floor(Math.random()*arr.length)]
}

// return the given value clamped between two bounds
function clamp(val, min, max) {
  return val < min ? min : (val > max ? max : val)
}

// return a random position [x,y] within a square of given width
function randomPosition(width, rng = Math.random) {
  return vec(rng()*width, rng()*width)
}

function minMaxBy(arr, f, op) {
  let result = null
  let value = null
  arr.forEach(e => {
    const eVal = f(e)
    if (result === null || op(eVal, value)) {
      value = eVal
      result = e
    }
  })
  return result
}

Array.prototype.maxBy = function(f) {
  return minMaxBy(this,f,(a,b)=>a>b)
}

Array.prototype.minBy = function(f) {
  return minMaxBy(this,f,(a,b)=>a<b)
}

Array.prototype.remove = function(e) {
  const i = this.indexOf(e)
  if (i != -1) this.splice(i,1)
}

Array.prototype.forEachPair = function(func) {
  forEachPair(this, func)
}


function sample(mean, stdv=1) {
  const u = Math.random()
  const v = Math.random()
  const sample = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return sample*stdv + mean
}
