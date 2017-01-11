import { List, Map } from "immutable";
import { dist, partial, curry, compose, createBubble } from "./helpers";

// getNewVY :: (Number, Number, Number) -> Number
const getNewVY = (vy, dt, g) => vy + (g * dt);

// getNewX :: (Number, Number, Number) -> Number
const getNewX = (x, dt, vx) => x + (dt * vx);

//getNewY :: (Number, Number, Number) -> Number
const getNewY = (y, dt, newVY) => y + (dt * newVY);

// doReflectX :: (Number, Number, Number) -> Bool
const doReflectX = (newX, radius, canvasWidth) => newX < radius || newX > (canvasWidth - radius);

// doReflectY :: (Number, Number, Number) -> Bool
const doReflectY = (newY, radius, canvasHeight) => newY < radius || newY > (canvasHeight - radius);

// updateBubble :: Map -> Map
const updateBubble = (bubble) => {
    const vX = bubble.get("vx");
    const vY = bubble.get("vy");
    const radius = bubble.get("radius");
    const dt = 0.02; // future -> use delta in time between requestAnimationFrame
    const g = 200;
    const newVY = getNewVY(bubble.get("vy"), dt, g);
    const newX = getNewX(bubble.get("x"), dt, vX);
    const newY = getNewY(bubble.get("y"), dt, newVY);
    const isXreflecting = doReflectX(newX, radius, 800);
    const isYreflecting = doReflectY(newY, radius, 600);
    return bubble.merge(Map({
        x: newX,
        y: newY,
        vx: isXreflecting ? vX * -1 : vX,
        vy: isYreflecting ? newVY : vY// Side-effects -> standardBubbles
    }));
};

// updateArrow :: Map -> MayBe
const updateArrow = arrow => {
    const step = 10;
    if (arrow === null) {
        return null; // use a mayBe
    }
    const newY = arrow.get("y") - step;
    const newArrow = arrow.merge({ y: newY});
    return newY > 0 ? newArrow : null;
};

// updatePlayerMovement :: ({String: Map}, Map, Number) -> Number
const updatePlayerMovement = (keys, player, canvasWidth) => {
    const step = 10;
    const playerX = player.get("x");
    const isMovingleft = keys.state.get("isLeftKeyPressed") && playerX > 0;
    const isMovingRight = keys.state.get("isRightKeyPressed") && playerX < (canvasWidth - player.get("w"));
    const deltaInMovement = (isMovingleft ? -step: 0) + (isMovingRight ? step: 0);
    return playerX + deltaInMovement;
};

// isPlayerShooting :: ({String: Map}, List) -> Bool
const isPlayerShooting = (keys, arrows) => keys.state.get("isSpaceKeyPressed") && arrows.size === 0;

// createArrow :: ({String: Map}, List, Map) -> List
const createArrows = (keys, arrows, newArrow) => isPlayerShooting(keys, arrows) ? arrows.push(newArrow) : arrows; // eslint-disable-line fp/no-mutating-methods

// getNewArrows :: ({String: Map}, Map, List, Number) -> List
const getArrows = (keys, player, arrows, canvasHeight) => {
    const newArrow = Map({
        x: player.get("x") + (player.get("w") / 2) - 1,
        y: canvasHeight,
        w: 3});
    return createArrows(keys, arrows, newArrow);
};

// filterArrows :: List -> List
const filterArrows = ary => ary.filter(x => x !== null);

// updateArrows :: List -> List
const updateArrows = ary => ary.map(updateArrow);

// getUpdatedArrows :: List -> List
const getUpdatedArrows = compose(filterArrows, updateArrows); // investigate associativity of compose

// isArrowStrikingBubble :: (Map, Map) -> Bool
const isRectStrikingBubble = (bubble, rect) => {
    const bubbleXpos = bubble.get("x");
    const bubble_radius = bubble.get("radius");
    const rectXpos = rect.get("x");
    const rectYpos = rect.get("y");
    const rightBubble = bubbleXpos + bubble_radius;
    const leftBubble = bubbleXpos - bubble_radius;
    const rightRect = rectXpos + rect.get("w");
    const leftRect = rectXpos;
    const rectYPos = rect.get("y");
    const bubbleYPos = bubble.get("y");
    // detect if rect tip is beneath bubble center
    if (rectYPos > bubbleYPos) {
        const dist1 = dist(bubbleXpos - rightRect, bubbleYPos - rectYPos);
        const dist2 = dist(bubbleXpos - leftRect, bubbleYPos - rectYPos);
        return (dist1 < bubble_radius) || (dist2 < bubble_radius);
    }
    // detect if rect tip is above bubble center
    return (rightBubble > leftRect) && (leftBubble < rightRect);
};

// isPlayerHit :: (List, Map) -> Bool
const isPlayerHit = (bubbles, player) => bubbles.reduce((acc, x) => acc || isRectStrikingBubble(x, player) ? true: false, false);

// makeSmallerBubble :: (Number, Map, Bool, List) -> Map
const makeSmallerBubble = (x, y, dir_right, color, size, standardBubbles) => {
    const step = 100;
    return createBubble(
        x, // depends if a right or left-sided bubble
        y,
        dir_right ? step : -step,
        standardBubbles.get(size).get("vy_init"),
        color,
        standardBubbles.get(size).get("radius"),
        size
    );
};

// getNewArrowsAndBubbles :: (List, List, List) -> Map
const getNewBubblesAndArrows = (arrows, bubbles, standardBubbles) => {
    for (let i = 0; i < arrows.size; i += 1) {
        for (let j = 0; j < bubbles.size; j += 1) {
            if (isRectStrikingBubble(bubbles.get(j), arrows.get(i))) {
                const newArrows = arrows.delete(i);
                const newBubbles1 = bubbles.delete(j);
                const oldBubble = bubbles.get(j);
                const newBubbles2 = oldBubble.get("size") > 0  ?
                          newBubbles1.push(
                              makeSmallerBubble(
                                  oldBubble.get("x") - oldBubble.get("radius"),
                                  oldBubble.get("y"),
                                  false,//moving left
                                  oldBubble.get("color"),
                                  oldBubble.get("size") - 1,
                                  standardBubbles
                              ),
                              makeSmallerBubble(// moving right
                                  oldBubble.get("x") + oldBubble.get("radius"),
                                  oldBubble.get("y"),
                                  true,//moving left
                                  oldBubble.get("color"),
                                  oldBubble.get("size") - 1,
                                  standardBubbles
                             )
                          ) : newBubbles1;
                return Map({ arrows: newArrows, bubbles: newBubbles2 });
            }
        }
    }
    return Map({ arrows: arrows, bubbles: bubbles });
};

// updateGame :: (Map, {String: Map}, {String: HTML}, Number) -> Map
export const updateGame = (state, keys, Html, dt) => {
    const player = state.get("player");
    const bubble = state.get("bubbles");
    const arrows = state.get("arrows");
    const standardBubbles = state.get("standardBubbles");
    const playerNewXPos = updatePlayerMovement(keys, player, Html.canvas.width);
    const newArrows = getArrows(keys, player, arrows, Html.canvas.height);
    const tuple = getNewBubblesAndArrows(getUpdatedArrows(newArrows), bubble.map(updateBubble), standardBubbles);
    const newPlayer = player.merge({x: playerNewXPos});
    const newGameState = Map({
        bubbles: tuple.get("bubbles"),
        player: newPlayer,
        arrows: tuple.get("arrows")
    });
    if (!isPlayerHit(tuple.get("bubbles"), newPlayer)) {
        return newGameState;
    }
    return state; // game over
};
