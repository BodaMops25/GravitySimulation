const colorsList = ['red', 'green', 'blue', 'gray', 'darkGray', 'purple']
const colors = [
    "#FF573390", // Bright Red-Orange
    "#33FF5790", // Bright Green
    "#3357FF90", // Bright Blue
    "#FF33A190", // Bright Pink
    "#FF8C3390", // Orange
    "#33FFF290", // Aqua
    "#FF333390", // Red
    "#9933FF90", // Purple
    "#33FF8C90", // Mint Green
    "#3333FF90", // Royal Blue
    "#FF573390", // Coral
    "#57FF3390", // Lime Green
    "#F1C40F90", // Yellow
    "#2980B990", // Navy Blue
    "#8E44AD90", // Plum
    "#D3540090", // Rust
    "#1ABC9C90", // Turquoise
    "#2ECC7190", // Green
    "#3498DB90", // Light Blue
    "#E74C3C90", // Bright Red
    "#9B59B690", // Lavender
    "#34495E90", // Dark Blue-Grey
    "#E67E2290", // Orange-Yellow
    "#BDC3C790", // Light Grey
    "#95A5A690", // Grey
    "#2C3E5090", // Charcoal
    "#7F8C8D90", // Steel Grey
    "#16A08590", // Teal
    "#C0392B90", // Maroon
    "#F39C1290"  // Amber
];

export function drawGrid(x, y, width, height, {
    ctx,
    lineWidth=1,
    strokeStyle='black',
    points,
    pointRadius=5,
    pointColor='black',
    pointLineWidth,
    pointStrokeStyle,
    pointCallback
} = {}) {
    const c = ctx

    if(points) {
        for(const point of points) {

            const pointX = x + point.pos.x,
                    pointY = y + point.pos.y
            
            c.beginPath()
            c.arc(pointX, pointY, point.radius || pointRadius, 0, Math.PI*2)
            c.fillStyle = point.color || pointColor
            c.fill()

            if(
                point.strokeStyle || point.lineWidth ||
                pointStrokeStyle || pointLineWidth
            ) {
                c.lineWidth = point.lineWidth || pointLineWidth || 1
                c.strokeStyle = point.strokeStyle || pointStrokeStyle || 'black'
                c.stroke()
            }

            if(pointCallback) {
                pointCallback(c, pointX, pointY, point)
            }
        }
    }

    c.lineWidth = lineWidth
    c.strokeStyle = strokeStyle

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

export function visualizeParticlesTreeInArea(particlesTree, {
    ctx,
    lineWidth,
    strokeStyle,
    pointRadius,
    pointColor,
    pointLineWidth,
    pointStrokeStyle,
    pointCallback,
    sectorCallback,
    x, y, width, height
} = {}, offsetX=0, offsetY=0) {

    // const strokeStyle = strokeStyle === 'random' ? randomArrayItem(colors) : strokeStyle || 'black'

    const points = [],
        gridWidth = particlesTree.data.scale * width,
        gridHeight = particlesTree.data.scale * height

    for(const sectorKey in particlesTree.sectors) {
        const sector = particlesTree.sectors[sectorKey]

        let additionalOffsetX = 0,
            additionalOffsetY = 0

        if(sectorKey?.includes('e')) additionalOffsetX = particlesTree.data.scale / 2
        if(sectorKey?.includes('s')) additionalOffsetY = particlesTree.data.scale / 2

        if(sector !== undefined && sector.sectors === undefined) points.push({
            ...sector,
            x: (sector.pos.x - offsetX) / particlesTree.data.scale * gridWidth,
            y: (sector.pos.y - offsetY) / particlesTree.data.scale * gridHeight
        })
        else if(sector.sectors !== undefined) {

            if(sectorCallback) sectorCallback(
                ctx,
                x + (sector.data.x - offsetX) / particlesTree.data.scale * gridWidth,
                y + (sector.data.y - offsetY) / particlesTree.data.scale * gridHeight,
                sector,
                points
            )

            visualizeParticlesTreeInArea(sector, {
                ctx,
                lineWidth,
                strokeStyle,
                points,
                pointRadius,
                pointColor,
                pointLineWidth,
                pointStrokeStyle,
                pointCallback,
                sectorCallback,
                x, y, width, height
            }, offsetX + additionalOffsetX, offsetY + additionalOffsetY)
        }
    }

    // points.push({
    //     x: (particlesTree.data.x - offsetX) / particlesTree.data.scale * gridWidth,
    //     y: (particlesTree.data.y - offsetY) / particlesTree.data.scale * gridHeight,
    //     radius: particlesTree.data.mass,
    //     color: strokeStyle,
    //     lineWidth: 1,
    //     strokeStyle: 'black',
    //     label: particlesTree.data.id
    // })

    const gridX = x + width * offsetX,
            gridY = y + height * offsetY

    drawGrid(gridX, gridY, gridWidth, gridHeight, {
        ctx,
        lineWidth,
        strokeStyle,
        points,
        pointRadius,
        pointColor,
        pointLineWidth,
        pointStrokeStyle,
        pointCallback
    })
}