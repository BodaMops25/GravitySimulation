import { createBarnesHutTree, randomBetween, simplifyBodiesForTarget } from './particlesTree.js'
import { visualizeParticlesTreeInArea } from './visualisation.js'

// setup

const points = [
    {label: 'A', x: 0, y: 0, mass: 0, color: 'black'},
    // {label: 'B', x: 6.875, y: 0.625, mass: 5},
    // {label: 'C1', x: 5.3125, y: 1.5625, mass: 5},
    // {label: 'C2', x: 5.9375, y: 2.1875, mass: 5},
    {label: 'D', x: 1000, y: 1000, mass: 0, color: 'black'}
]

/* points = [
    {label: 'A', x: 0, y: 0, mass: 1},
    {label: 'B', x: 9, y: 1, mass: 1},
    {label: 'C', x: 6, y: 4, mass: 1},
    {label: 'D', x: 10, y: 10, mass: 1}
] */

/* points = [
    {label: 'A', x: 0, y: 1, mass: 1},
    {label: 'B', x: 3.25, y: 1, mass: 1},
    {label: 'C', x: 10, y: 1.0001, mass: 1}
] */

for(let i = 0; i < 50; i++) points.push({
    label: i.toString(),
    x: randomBetween(1000, 1, 1),
    y: randomBetween(1000, 1, 1),
    mass: 5
})

// cnvs setup

const cnvs = document.querySelector('canvas'),
        ctx = cnvs.getContext('2d')

cnvs.width = window.innerWidth
cnvs.height = window.innerHeight

ctx.font = '20px sans-serif'

// program

const tree = createBarnesHutTree(points)

visualizeParticlesTreeInArea(tree, {
    ctx,
    pointColor: 'orange',
    pointRadius: 5,
    lineWidth: 2,
    strokeStyle: 'random',
    x: 40,
    y: 40,
    width: 1,
    height: 1,
    pointCallback: (ctx, x, y, point) => {
        ctx.fillText(point.label, x + 6, y + 6)
    },
    sectorCallback: (ctx, x, y, sector, points) => {
        // ctx.beginPath()
        // ctx.fillStyle = '#000000a0'
        // ctx.arc(x, y, sector.data.mass, 0, Math.PI * 2)
        // ctx.fill()

        // ctx.fillText(sector.data.id, x + sector.data.mass, y + sector.data.mass)
    }
})

const firstPoint = points[20],
        simplifiedBodies = simplifyBodiesForTarget(firstPoint, tree, .5)
console.log(simplifiedBodies)

ctx.lineWidth = 2
ctx.strokeStyle = 'black'

const ox = 40,
        oy = 40

for(const body of simplifiedBodies) {
    const x = body.x !== undefined ? body.x : body.data.x,
            y = body.y !== undefined ? body.y : body.data.y

    ctx.beginPath()
    ctx.moveTo(ox + firstPoint.x, oy + firstPoint.y)
    ctx.lineTo(ox + x, oy + y)
    ctx.stroke()
}