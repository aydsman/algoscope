# AlgoScope — Interactive Data Structures & Algorithms Visualizer

**AlgoScope** is a modern, responsive, zero-dependency interactive application for visualizing computer science algorithms and data structures. It gives users complete control over data inputs, custom values, and dynamic sizing, backed by reversible step-by-step playback and synchronized pseudocode.

---

## 🌟 Key Features

1. **Custom Value Input & Dynamic Sizing**:
   - Provide custom comma/space-separated values across all modules (e.g. `50, 25, 75, 12, 37`).
   - Sliders to dynamically scale input sizes (e.g., sorting 5 to 120 bars, searching arrays, stack/queue capacity, tree nodes, grid dimensions).
   - Random generation and presets (Nearly sorted, Reversed, Few unique, Mazes).

2. **Full Playback & Time-Travel Controls**:
   - Every operation precomputes its frames, allowing forward/backward single-stepping and scrubbing slider.
   - Play/pause toggle and exponential speed slider (from 1 step/second up to real-time).
   - Global keyboard shortcuts: `Space` for Play/Pause, `←` / `→` for Step Back / Step Forward.

3. **Synchronized Pseudocode & Complexity Analysis**:
   - Step-by-step active line highlighting in real-time.
   - Comprehensive status messages describing what the algorithm is comparing, swapping, or traversing.
   - Big-O complexity tables (Best, Average, Worst Time, and Auxiliary Space).

---

## 📚 Visualized Data Structures & Algorithms

### 1. Sorting Algorithms (`#/sorting`)
- **Bubble Sort** (with early termination check)
- **Selection Sort**
- **Insertion Sort**
- **Merge Sort**
- **Quick Sort** (Lomuto partitioning)
- **Heap Sort** (Max-heap sift-down)
- *Controls*: Array size (5–120), Initial order presets (Random, Nearly sorted, Reversed, Few unique), Custom numbers input.

### 2. Searching Algorithms (`#/searching`)
- **Linear Search**
- **Binary Search** (with lo/mid/hi pointers and discarded range dimming)
- **Jump Search** ($\lfloor\sqrt{n}\rfloor$ block jumps)
- *Controls*: Custom values, random target generator, custom target input.

### 3. Stack & Queue (`#/stack-queue`)
- **Stack (LIFO)** with overflow/underflow checks and `top` pointer
- **Circular Queue (FIFO)** with `front` / `rear` wrap-around calculations
- *Controls*: Fixed capacity slider (3–12 slots), Push/Enqueue, Pop/Dequeue, Peek, Fill randomly, Clear.

### 4. Singly Linked List (`#/linked-list`)
- Node pointer chains with `val` and `next` pointer boxes
- Operations: `insertHead`, `insertTail`, `insertAt(i)`, `deleteValue`, `search`, and in-place 3-pointer `reverse`
- *Controls*: Initial length slider, custom values list, index & value inputs.

### 5. Binary Search Tree (`#/bst`)
- Dynamic hierarchical SVG tree layout with in-order horizontal positioning
- Operations: Insert, Search, Delete (Leaf, Single-child, and Two-child In-order Successor replacement)
- Traversal animations with order strip:
  - **In-order** (Left-Root-Right, sorted order)
  - **Pre-order** (Root-Left-Right)
  - **Post-order** (Left-Right-Root)
  - **Level-order** (Breadth-First Search using queue)

### 6. Binary Heap / Priority Queue (`#/heap`)
- Dual Synchronized View: Array layout with `parent = ⌊(i-1)/2⌋` mapping AND SVG Binary Tree
- Property toggle: **Max-Heap** (Priority Queue) vs **Min-Heap**
- Operations: Insert with Sift-Up, Extract Top with Sift-Down, and $O(n)$ bottom-up Heapify on arbitrary arrays.

### 7. Pathfinding & Graphs (`#/pathfinding`)
- 2D grid graph traversal
- Algorithms:
  - **Breadth-First Search (BFS)** — unweighted shortest path
  - **Depth-First Search (DFS)** — exhaustive stack exploration
  - **Dijkstra's Algorithm** — weighted shortest path with priority queue
  - **A\* Search** — heuristic-guided shortest path with Manhattan distance
- *Interactive Drawing*:
  - Drag Start (green) and Target (red) nodes
  - Paint / erase walls (impassable obstacles)
  - Paint weighted terrain (cost +5 swamps)
  - Preset Mazes: Recursive Division maze, Random 30% obstacles, Swamp terrain.

---

## 🚀 How to Run

### Option 1: Zero-Dependency Local Node Server (Recommended)
```bash
node server.js
```
Then open your browser to **http://localhost:3000**.

### Option 2: Directly Open `index.html`
AlgoScope is built with vanilla modern HTML5, CSS3, and ES6 JavaScript with zero build steps or external dependencies. You can simply double-click or open `index.html` in any modern web browser.

---

## ⌨️ Keyboard Shortcuts
- <kbd>Space</kbd>: Play / Pause the active visualization
- <kbd>←</kbd>: Step back one frame
- <kbd>→</kbd>: Step forward one frame
