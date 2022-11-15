# h-pkit

## Overview
Fast, small, low-effort, zero-dependency pathfinding kit for 2D square-grid maps. Try an interactive demo [here](https://halbu.github.io/h-pkit-demo)

## More verbose overview
`h-pkit` (**h**albu's **p**athfinding **kit**) is a Typescript pathfinding library. It implements the [A* pathfinding algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm), allows for considerable customisation, and supplements it with some nice-to-have extensions (preference for line-of-sight pathing where possible, multi-pass string-pulling algorithm for path smoothing and naturalisation). It is intended for use in any game, simulation or other application that models space with a two-dimensional grid.

It has been designed to require no coupling to your application's data structures or code, and minimal effort to incorporate into a project. The average user should be able to import the package and start generating paths with no further setup or configuration.

## Usage
Let's assume our application models a map with a 2D array of cells which have a boolean property `walkable`:
```typescript
let hpkit = new HPKit();
let path = hpkit.getPath(4, 3, 15, 17, (x, y) => this.map[x][y].walkable)
```
The first four parameters are origin XY and goal XY. The fifth parameter is the callback that `h-pkit` will use to test whether a location is passable. `getPath` will return an array of `[number, number]` representing the optimal path to the goal, or `null` if no path exists.

## Installation
`h-pkit` is distributed as a hybrid module for both ESM and CJS. Install with `npm i h-pkit` and then either import or require it, whichever you prefer.

  * `import { HPKit } from 'h-pkit';`
  * `let { HPKit } = require('h-pkit');`

## Configuration
`h-pkit` exposes methods for configuring heuristics, movement weights, limits and convenience functionality:
| Option      | Acceptable Values     | Default | Method |
| ----------- | ----------- | ----------- | --- |
| diagonal movement| true, false | true | `allowDiagonals(boolean)`|
| heuristic | euclidean, manhattan, octile, chebyshev | euclidean | `setHeuristic(string)`
| cardinal/diagonal movement costs | any two numbers| 1, sqrt(2)| `setMoveCosts(number, number)`
| maximum path cost | any positive number or 0 (no max) | no max | `setMaxCost(number)`
| maximum path moves | any positive number or 0 (no max) | no max | `setMaxMoves(number)`
| straight-line path preference| true, false| false| `preferStraightLinePath(boolean)`
| string-pull path postprocessing| true, false| false| `applyStringPulling(boolean)`

Certain options are mutually exclusive: straight-line preference and string-pulling cannot be enabled if you have disabled diagonal movement. `h-pkit` will throw an error if incompatible configuration options are selected.

## Considerations
Co-ordinate values must be zero or greater. The closed list is implemented with a map of integers for fast lookup, and nodes generate keys via the function `id() => (x << 16) | y`, which requires that x and y are >=0 in order to guarantee uniqueness.

As `h-pkit` is decoupled from your implementation, it does not know the dimensions of your graph, and if left to its own devices may path out of bounds when searching. If your map has impassable cells at its edges this is a non-issue; if not, you can express your boundary constraints as part of the callback:
```typescript
hpkit.getPath(
  2, 2, 5, 5,
  (x, y) => x >= 0 && y >= 0 && x < w && y < h && map[x][y].walkable
)
```