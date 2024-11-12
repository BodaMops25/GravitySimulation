export function createGrid(x, y, width, height, options) {
    const c = options.ctx

    if(options.points) {
        for(const point of options.points) {
            
            c.beginPath()
            c.arc(x + point.x, y + point.y, point.radius, 0, Math.PI*2)
            c.fillStyle = point.color
            c.fill()
        }
    }

    c.lineWidth = options.lineWidth
    c.strokeStyle = options.strokeStyle

    c.beginPath()
    c.rect(x, y, width, height)
    c.stroke()

    c.beginPath()
    c.moveTo(x, y + height/2)
    c.lineTo(x + width, y + height/2)
    c.stroke()

    c.beginPath()
    c.moveTo(x + width/2, y)
    c.lineTo(x + width/2, y + height)
    c.stroke()
}

export function visualizeParticlesTreeInArea(particlesTree, options, sectorKey) {
    const points = []

    for(const sectorKey of particlesTree.sectors) {
        const sector = particlesTree.sectors[sectorKey]

        if(sector.label !== undefined) points.push({
            x: sector.x,
            y: sector.y,
            color: 'orange',
            radius: 5
        })
    }

    let offsetX = 0,
        offsetY = 0

    createGrid(options.x + offsetX, options.y + offsetY, particlesTree.data.scale, particlesTree.data.scale, {
        ctx: options.ctx,
        lineWidth: options.lineWidth,
        strokeStyle: options.strokeStyle,
        points
    })
}