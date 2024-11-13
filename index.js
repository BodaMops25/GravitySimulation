import { getAreaCorners, createParticlesTree } from './particlesTree.js'
import { visualizeParticlesTreeInArea } from './visualisation.js'

// setup

export const threshold = .5

const root = {},
    points = [
    {label: 'A', x: 0, y: 0, mass: 5},
    {label: 'B', x: 6.875, y: 0.625, mass: 5},
    {label: 'C1', x: 5.3125, y: 1.5625, mass: 5},
    {label: 'C2', x: 5.9375, y: 2.1875, mass: 5},
    {label: 'D', x: 10, y: 10, mass: 5}
]

// points = [
//     {label: 'A', x: 0, y: 0, mass: 1},
//     {label: 'B', x: 6, y: 1, mass: 1, color: 'red'},
//     {label: 'C', x: 9, y: 1, mass: 1, color: 'red'},
//     {label: 'D', x: 10, y: 10, mass: 1}
// ]

// cnvs setup

const cnvs = document.querySelector('canvas'),
        ctx = cnvs.getContext('2d')

cnvs.width = window.innerWidth
cnvs.height = window.innerHeight

// program

const area = getAreaCorners(points)

for(const point of points) {
    createParticlesTree(root, point, area)
}

console.log(root);


visualizeParticlesTreeInArea(root, {
    ctx,
    pointColor: 'orange',
    pointRadius: 12,
    lineWidth: 3,
    strokeStyle: 'black',
    x: 40,
    y: 40,
    width: 100,
    height: 100
})