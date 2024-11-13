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

export function visualizeParticlesTreeInArea(particlesTree, options, initalScale) {
    if(initalScale === undefined) initalScale = particlesTree.data.scale
    if(options.offsetX === undefined) options.offsetX = 0
    if(options.offsetY === undefined) options.offsetY = 0

    const points = [],
        gridWidth = particlesTree.data.scale * options.width,
        gridHeight = particlesTree.data.scale * options.height

    for(const sectorKey in particlesTree.sectors) {
        const sector = particlesTree.sectors[sectorKey]

        let offsetX = 0,
            offsetY = 0

        if(sectorKey?.includes('e')) offsetX = particlesTree.data.scale / 2
        if(sectorKey?.includes('s')) offsetY = particlesTree.data.scale / 2

        if(sector.label !== undefined) points.push({
            x: (sector.x - options.offsetX) / particlesTree.data.scale * gridWidth,
            y: (sector.y - options.offsetY) / particlesTree.data.scale * gridHeight,
            color: sector.color !== undefined ? sector.color : options.pointColor,
            radius: sector.radius !== undefined ? sector.radius : options.pointRadius,
            label: sector.label
        })
        if(sector.sectors !== undefined) {

            visualizeParticlesTreeInArea(sector, {
                ...options,
                offsetX: options.offsetX + offsetX,
                offsetY: options.offsetY + offsetY
            }, initalScale)
        }
    }

    createGrid(options.x + options.width * options.offsetX, options.y + options.height * options.offsetY, gridWidth, gridHeight, {
        ctx: options.ctx,
        lineWidth: options.lineWidth,
        strokeStyle: options.strokeStyle,
        points
    })
}