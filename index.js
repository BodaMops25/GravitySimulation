const poinst = [
    {label: 'A', x: 0, y: 0, mass: 5},
    {label: 'B', x: 6.3, y: 1.1, mass: 5},
    {label: 'C', x: 5.6, y: 1.8, mass: 5},
    {label: 'D', x: 10, y: 10, mass: 5}
]

function getAreaCorners(poinsts) {
    let min_x = poinsts[0].x, min_y = poinsts[0].y, max_x = poinsts[0].x, max_y = poinsts[0].y
    
    for(const {x, y} of poinsts) {
        if(x < min_x) min_x = x
        else if(x > max_x) max_x = x

        if(y < min_y) min_y = y
        else if(y > max_y) max_y = y
    }

    return {min_x, min_y, max_x, max_y}
}