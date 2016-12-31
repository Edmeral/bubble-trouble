import { List, Map } from "immutable";
import { dist, partial, curry, compose } from "./helpers";
import { Model } from "./model";

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
const updateBubble = bubble => {
    const vX = bubble.get("vx");
    const radius = bubble.get("radius");
    const dt = 0.02; // future -> use delta in time between requestAnimationFrame
    const g = 200;
    const newVY = getNewVY(bubble.get("vy"), dt, g);
    const newX = getNewX(bubble.get("x"), dt, bubble.get("vx"));
    const newY = getNewY(bubble.get("y"), dt, newVY);
    return bubble.merge(Map({
        x: newX,
        y: newY,
        vx: doReflectX(newX, radius, 800) ? vX * -1 : vX,
        vy: doReflectY(newY, radius, 600) ? Model.get("standardBubbles").get(bubble.get("size")).get("vy_init") : newVY // Side-effects -> Html && standardBubbles
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

// isPlayerShooting :: ({String: Map}, List) -> Boolean
const isPlayerShooting = (keys, arrows) => keys.state.get("isSpaceKeyPressed") && arrows.size === 0;

// createArrow :: ({String: Map}, List, Map) -> List
const createArrow = (keys, arrows, newArrow) => isPlayerShooting(keys, arrows) ? arrows.push(newArrow) : arrows; // eslint-disable-line fp/no-mutating-methods

// getNewArrows :: ({String: Map}, Map, List, Number) -> List
const getNewArrows = (keys, player, arrows, canvasHeight) => {
    const newArrow = Map({
        x: player.get("x") + (player.get("w") / 2) - 1,
        y: canvasHeight,
        w: 3});
    const arrowList = createArrow(keys, arrows, newArrow);
    return arrowList;
};

// filterArrows :: List -> List
const filterArrows = ary => ary.filter(x => x !== null);

// updateArrows :: List -> List
const updateArrows = ary => ary.map(updateArrow);

// getUpdatedArrows :: List -> List
const getUpdatedArrows = compose(filterArrows, updateArrows); // investigate associativity of compose

// isArrowStrikingBubble :: (Map, Map) -> bool
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

// helper function to create bubbles
const makeSmallerBubble = (x, y, direction_right, color, size) => Map({
    x: x,
    y: y,
    vx: direction_right ? 100 : -100,
    vy: standardBubbles.get(size).get("vy_init"), // side-effect 1
    color: color,
    radius: standardBubbles.get(size).get("radius"), // side-effect 2
    size: size
});

// replace for loop with map
const getNewBubblesAndArrows = (arrows, bubbles) => {
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
                                  oldBubble.get("size") - 1 // construct smaller bubble
                              ),
                              makeSmallerBubble(// moving right
                                  oldBubble.get("x") + oldBubble.get("radius"),
                                  oldBubble.get("y"),
                                  true,//moving right
                                  oldBubble.get("color"),
                                  oldBubble.get("size") - 1
                              )
                          ) : newBubbles1; // B2 -> list of bubbles with the bubble that was hit removed
                return Map({ arrows: newArrows, bubbles: newBubbles2 });
            }
        }
    }
    return Map({ arrows: arrows, bubbles: bubbles });
};

// updateGame :: Map: any, {String: Map}, {String: HTML}, Number ) -> Map: any
export const updateGame = (state, keys, Html, dt) => {
    const player = state.get("player");
    const bubble = state.get("bubbles");
    const arrows = state.get("arrows");
    const playerNewXPos = updatePlayerMovement(keys, player, Html.canvas.width);
    const newArrows = getNewArrows(keys, player, arrows, Html.canvas.height);
    const tuple = getNewBubblesAndArrows(getUpdatedArrows(newArrows), bubble.map(updateBubble));
    const newPlayer = player.merge({x: playerNewXPos});
    const newGameState = Map({
        bubbles: tuple.get("bubbles"),
        player: newPlayer,
        arrows: tuple.get("arrows")
    });
    if (!isPlayerHit(tuple.get("bubbles"), newPlayer)) {
        return newGameState;
    }
    return state;
};
