import { createGrid } from './visualisation.js'

// setup

// export const threshold = .5

// const root = {},
// //       points = [
// //       {label: 'A', x: 0, y: 0, mass: 5},
// //       {label: 'B', x: 6.3, y: 1.1, mass: 5},
// //       {label: 'C', x: 5.6, y: 1.8, mass: 5},
// //       {label: 'D', x: 10, y: 10, mass: 5}
// // ]

// points = [
//     {label: 'A', x: 0, y: 0, mass: 1},
//     {label: 'B', x: 8, y: 0, mass: 1},
//     {label: 'C', x: 10, y: 0, mass: 1}
// ]

// cnvs setup

const cnvs = document.querySelector('canvas'),
        ctx = cnvs.getContext('2d')

cnvs.width = window.innerWidth
cnvs.height = window.innerHeight