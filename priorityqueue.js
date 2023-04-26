class PriorityQueue {

  constructor() {
    this.size = 0
    this.counter = 0

    // Create an empty array
    this.underlying = [];

    // element map to quickly access element positions by id
    this.index = {}
  }

  /**
   * 
   * @param {*} element
   * @param {*} priority if p1 < p2 then p1 has higher priority
   * @return {number} entry id used for updating
   */
  enqueue(element, priority) {

    const entry = {
      data: element,
      id: this.counter,
      priority: priority
    }
    
    if (this.size == this.underlying.length)
      this.underlying.push(entry)
    else
      this.underlying[this.size] = entry
      
    // store index of element
    this.index[this.counter] = this.size

    this.size++
    this.counter++

    // Allow it to bubble up
    this.#bubbleUp(this.size-1)

    return entry.id
  }

  /**
   * @param {number} id id of element 
   * @param {*} newPriority new priority of element
   */
  updatePriority(id, newPriority) {
    const idx = this.index[id]
    if (idx != undefined) {
      const entry = this.underlying[idx]
      const oldPriority = entry.priority
      entry.priority = newPriority
      if (newPriority < oldPriority) this.#bubbleUp(idx)
      else this.#bubbleDown(idx)
    } else {
      throw `no element with that id ${id}`
    }
  }

  // remove element at the given index in this.underlying
  #removeElement(idx) {
    if (this.size == 0) throw `empty queue`

    const value = this.underlying[idx]

    this.#swap(idx, this.size-1)
    this.size--
    delete this.index[value.id]
    this.#bubbleDown(idx)

    // TODO resize array if this.size = this.underlying.length/4
    return value.data
  }

  /**
   * 
   * @returns highest priority element
   */
  dequeue() {
    return this.#removeElement(0)
  }

  top() {
    if (this.size == 0) throw `empty queue`
    return this.underlying[0].data
  }

  topPriority() {
    if (this.size == 0) throw `empty queue`
    return this.underlying[0].priority
  }

  // swap the item at the given index up until it reaches valid position
  #bubbleUp (idx) {
    const element = this.underlying[idx];
    let i = idx
    // While not at the front of the array
    while (i > 0) {
      const parentIdx = Math.floor((i-1)/2)
      const parentPriority = this.underlying[parentIdx].priority
        // If the element is greater than its parent, swap them
        if (element.priority < parentPriority) this.#swap(i,parentIdx)
        else break

        i = parentIdx
    }
  }

  // swap the item at the given index down until it reaches valid position
  #bubbleDown(idx) {
    const element = this.underlying[idx];
    let i = idx
    // keep swapping with children if there's a child with higher priority
    while (i < this.size-1) {
      const childIdx1 = 2*i+1
      const childIdx2 = 2*i+2
      
      // check first child
      if (childIdx1 < this.size) {
        const childPriority = this.underlying[childIdx1].priority
        if (childPriority < element.priority) {
          this.#swap(i,childIdx1)
          i = childIdx1
          continue
        }
      }
      
      // check second child
      if (childIdx2 < this.size) {
        const childPriority = this.underlying[childIdx2].priority
        if (childPriority < element.priority) {
          this.#swap(i,childIdx2)
          i = childIdx2
          continue
        }
      }
      
      break
    }
  }

  /* Swaps the elements at the given indices 
   * index1: The index of the first element
   * index2: The index of the second element
   */
  #swap (index1, index2) {
    const id1 = this.underlying[index1].id
    const id2 = this.underlying[index2].id

    const temp = this.underlying[index1];
    this.underlying[index1] = this.underlying[index2];
    this.underlying[index2] = temp;

    this.index[id1] = index2
    this.index[id2] = index1
  }

}