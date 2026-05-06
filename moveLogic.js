let lastDirection = null;

function findBestFoodMove(myHead, safeMoves, possibleMoves, food) {
    let closestFood = null;
    let shortestDistance = Infinity;
    
    for (const foodPiece of food) {
        const distance = Math.abs(myHead.x - foodPiece.x) + Math.abs(myHead.y - foodPiece.y);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            closestFood = foodPiece;
        }
    }
    
    let bestMove = null;
    let bestDistance = Infinity;
    
    for (const move of safeMoves) {
        const nextPos = possibleMoves[move];
        const distanceToFood = Math.abs(nextPos.x - closestFood.x) + Math.abs(nextPos.y - closestFood.y);
        
        if (distanceToFood < bestDistance) {
            bestDistance = distanceToFood;
            bestMove = move;
        }
    }
    
    return bestMove || safeMoves[0];
}
function willTrapItself(nextPos, myBody, gameState) {
    const bodyWithoutTail = myBody.slice(0, -1);
    
    for (const bp of bodyWithoutTail) {
        if (bp.x === nextPos.x && bp.y === nextPos.y) {
            return true;
        }
    }
    
    let futureSpace = 0;
    const neighbors = [
        {x: nextPos.x, y: nextPos.y + 1},
        {x: nextPos.x, y: nextPos.y - 1},
        {x: nextPos.x + 1, y: nextPos.y},
        {x: nextPos.x - 1, y: nextPos.y}
    ];
    
    for (const n of neighbors) {
        if (n.x >= 0 && n.x < gameState.board.width &&
            n.y >= 0 && n.y < gameState.board.height) {
            let isOccupied = false;
            for (const bp of bodyWithoutTail) {
                if (bp.x === n.x && bp.y === n.y) {
                    isOccupied = true;
                    break;
                }
            }
            if (!isOccupied) futureSpace++;
        }
    }
    
    return futureSpace <= 1;
}
function getNearestEnemyDistance(myHead, gameState) {
    let minDistance = Infinity;
    for (const snake of gameState.board.snakes) {
        if (snake.id === gameState.you.id) continue;
        const enemyHead = snake.body[0];
        const distance = Math.abs(myHead.x - enemyHead.x) + Math.abs(myHead.y - enemyHead.y);
        minDistance = Math.min(minDistance, distance);
    }
    return minDistance;
}

export default function move(gameState) {
    let moveSafety = {
        up: true,
        down: true,
        left: true,
        right: true
    };
    
    const myHead = gameState.you.body[0];
    const myNeck = gameState.you.body[1];
    const myBody = gameState.you.body; 
    
    if (myNeck.x < myHead.x) moveSafety.left = false;
    else if (myNeck.x > myHead.x) moveSafety.right = false;
    else if (myNeck.y < myHead.y) moveSafety.down = false;
    else if (myNeck.y > myHead.y) moveSafety.up = false;
    
    const boardWidth = gameState.board.width;
    const boardHeight = gameState.board.height;
    
    if (myHead.y + 1 >= boardHeight) moveSafety.up = false;
    if (myHead.y - 1 < 0) moveSafety.down = false;
    if (myHead.x + 1 >= boardWidth) moveSafety.right = false;
    if (myHead.x - 1 < 0) moveSafety.left = false;

    const possibleMoves = { 
        up: { x: myHead.x, y: myHead.y + 1 },
        down: { x: myHead.x, y: myHead.y - 1 },
        left: { x: myHead.x - 1, y: myHead.y },
        right: { x: myHead.x + 1, y: myHead.y }
    };
    
    for (let i = 0; i < myBody.length - 1; i++) {
        const bp = myBody[i];
        const isTail = (i === myBody.length - 1);
        
        if (!isTail) {
            if (possibleMoves.up.x === bp.x && possibleMoves.up.y === bp.y) moveSafety.up = false;
            if (possibleMoves.down.x === bp.x && possibleMoves.down.y === bp.y) moveSafety.down = false;
            if (possibleMoves.left.x === bp.x && possibleMoves.left.y === bp.y) moveSafety.left = false;
            if (possibleMoves.right.x === bp.x && possibleMoves.right.y === bp.y) moveSafety.right = false;
        }
    }
    
    for (const snake of gameState.board.snakes) {
        if (snake.id === gameState.you.id) continue;
        
        for (const bp of snake.body) {
            if (possibleMoves.up.x === bp.x && possibleMoves.up.y === bp.y) moveSafety.up = false;
            if (possibleMoves.down.x === bp.x && possibleMoves.down.y === bp.y) moveSafety.down = false;
            if (possibleMoves.left.x === bp.x && possibleMoves.left.y === bp.y) moveSafety.left = false;
            if (possibleMoves.right.x === bp.x && possibleMoves.right.y === bp.y) moveSafety.right = false;
        }
    }

    const hazards = gameState.board.hazards || [];
   
    for (const hazard of hazards) {
        if (possibleMoves.up.x === hazard.x && possibleMoves.up.y === hazard.y) moveSafety.up = false;
        if (possibleMoves.down.x === hazard.x && possibleMoves.down.y === hazard.y) moveSafety.down = false;
        if (possibleMoves.left.x === hazard.x && possibleMoves.left.y === hazard.y) moveSafety.left = false;
        if (possibleMoves.right.x === hazard.x && possibleMoves.right.y === hazard.y) moveSafety.right = false;
    }
    
    const enemyDistance = getNearestEnemyDistance(myHead, gameState);
    
    const safeMoves = Object.keys(moveSafety).filter(d => moveSafety[d]);
    
    if (safeMoves.length === 0) {
        console.log(`MOVE ${gameState.turn}: No safe moves! Moving down`);
        return { move: "down" };
    }
    
    for (const snake of gameState.board.snakes) {
        if (snake.id === gameState.you.id) continue;
        const enemyHead = snake.body[0];
        const enemyNeck = snake.body[1];
        const distance = Math.abs(myHead.x - enemyHead.x) + Math.abs(myHead.y - enemyHead.y);
        
        if (distance === 2) {
            const enemyDir = {
                x: enemyHead.x - enemyNeck.x,
                y: enemyHead.y - enemyNeck.y
            };
            const nextEnemyPos = {
                x: enemyHead.x + enemyDir.x,
                y: enemyHead.y + enemyDir.y
            };
            
            if (nextEnemyPos.x === myHead.x && nextEnemyPos.y === myHead.y) {
                for (const move of safeMoves) {
                    const nextPos = possibleMoves[move];
                    if (Math.abs(nextPos.x - enemyHead.x) + Math.abs(nextPos.y - enemyHead.y) > 1) {
                        console.log(`MOVE ${gameState.turn}: Dodging enemy head-on! ${move}`);
                        return { move: move };
                    }
                }
            }
        }
    }
    
    const myHealth = gameState.you.health;
    const food = gameState.board.food;
    
    if (enemyDistance <= 2) {
        let bestEscape = null;
        let bestDistance = -1;
        
        for (const move of safeMoves) {
            const nextPos = possibleMoves[move];
            let minDistToEnemy = Infinity;
            
            for (const snake of gameState.board.snakes) {
                if (snake.id === gameState.you.id) continue;
                const enemyHead = snake.body[0];
                const dist = Math.abs(nextPos.x - enemyHead.x) + Math.abs(nextPos.y - enemyHead.y);
                minDistToEnemy = Math.min(minDistToEnemy, dist);
            }
            
            if (minDistToEnemy > bestDistance) {
                bestDistance = minDistToEnemy;
                bestEscape = move;
            }
        }
        
        if (bestEscape) {
            console.log(`MOVE ${gameState.turn}: Enemy very close! Escaping with ${bestEscape}`);
            return { move: bestEscape };
        }
    }
    
    if (myHealth >= 55 && enemyDistance > 3) {
        const cyclePattern = ['right', 'down', 'left', 'up'];
        let nextMove = null;
        
        if (lastDirection) {
            const currentIndex = cyclePattern.indexOf(lastDirection);
            const patternMove = cyclePattern[(currentIndex + 1) % cyclePattern.length];
            
            if (safeMoves.includes(patternMove)) {
                nextMove = patternMove;
            }
        }
        
        if (!nextMove && safeMoves.length > 0) {
            nextMove = safeMoves[0];
        }
        
        if (!nextMove) {
            console.log(`MOVE ${gameState.turn}: No safe moves in cycle`);
            return { move: "down" };
        }
        
        lastDirection = nextMove;
        console.log(`MOVE ${gameState.turn}: Health ${myHealth} cycling with ${nextMove}`);
        return { move: nextMove };
    }
    
    lastDirection = null;
    
    if (myHealth >= 30 && food.length > 0) {
        const nextMove = findBestFoodMove(myHead, safeMoves, possibleMoves, food);
        console.log(`MOVE ${gameState.turn}: Health ${myHealth} in middle range, moving towards food`);
        return { move: nextMove };
    }
    
    if (myHealth < 30 && food.length > 0) {
        const nextMove = findBestFoodMove(myHead, safeMoves, possibleMoves, food);
        console.log(`MOVE ${gameState.turn}: Health ${myHealth} is low! Moving towards food urgently`);
        return { move: nextMove };
    }
    
    const nextMove = safeMoves[0];
    console.log(`MOVE ${gameState.turn}: Health ${myHealth}, just surviving`);
    return { move: nextMove };
}