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

function isSafeFromSnakes(myHead, possibleMoves, gameState) {
    for (const snake of gameState.board.snakes) {
        if (snake.id === gameState.you.id) continue;
        
        const enemyHead = snake.body[0];
        const distance = Math.abs(myHead.x - enemyHead.x) + Math.abs(myHead.y - enemyHead.y);
        
        if (distance <= 2) {
            return false;
        }
    }
    return true;
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
    
    for (const snake of gameState.board.snakes) {
        if (snake.id === gameState.you.id) continue;
        
        const enemyHead = snake.body[0];
        const distanceToEnemy = Math.abs(myHead.x - enemyHead.x) + Math.abs(myHead.y - enemyHead.y);
        
        if (distanceToEnemy <= 3) {
            const dx = enemyHead.x - myHead.x;
            const dy = enemyHead.y - myHead.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) moveSafety.left = false;
                else moveSafety.right = false;
            } else {
                if (dy > 0) moveSafety.down = false;
                else moveSafety.up = false;
            }
        }
    }

    const hazards = gameState.board.hazards || [];
   
    for (const hazard of hazards) {
        if (possibleMoves.up.x === hazard.x && possibleMoves.up.y === hazard.y) moveSafety.up = false;
        if (possibleMoves.down.x === hazard.x && possibleMoves.down.y === hazard.y) moveSafety.down = false;
        if (possibleMoves.left.x === hazard.x && possibleMoves.left.y === hazard.y) moveSafety.left = false;
        if (possibleMoves.right.x === hazard.x && possibleMoves.right.y === hazard.y) moveSafety.right = false;
    }
    
    const safeMoves = Object.keys(moveSafety).filter(d => moveSafety[d]);
    
    if (safeMoves.length === 0) {
        console.log(`MOVE ${gameState.turn}: No safe moves! Moving down`);
        return { move: "down" };
    }
    
    const myHealth = gameState.you.health;
    const food = gameState.board.food;
    const isCompletelySafe = isSafeFromSnakes(myHead, possibleMoves, gameState);
    
    if (myHealth >= 55 && isCompletelySafe) {
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