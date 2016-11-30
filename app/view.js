/*eslint fp/no-unused-expression: 0, fp/no-nil: 0 */

import { default as Html } from "./assets";
import interrogateKeyState from "./keystate";
import { List, Map } from "immutable";
import updateGame from "./update";
import { Model } from "./model";

(function () {

    const canvas = Html.canvas;

    const keys = {
        state: Map({
            isRightKeyPressed: false,
            isLeftKeyPressed: false,
            isSpaceKeyPressed: false,
            isRKeyPressed: false
        })
    };

    interrogateKeyState(keys);

    window.addEventListener("load", () => {
        const screen = canvas.getContext("2d");

        function drawPlayer(player) {
            screen.fillStyle = player.get("color"); // eslint-disable-line fp/no-mutation
            screen.fillRect(player.get("x"), canvas.height - player.get("h"), player.get("w"), player.get("h"));
        }

        // impure rendering fn that populates canvas
        function drawBubble(bubble) {
            screen.beginPath();
            screen.arc(bubble.get("x"), bubble.get("y"), bubble.get("radius"), 0, Math.PI*2, false);
            screen.fillStyle = bubble.get("color"); // eslint-disable-line fp/no-mutation
            screen.fill();
            screen.closePath();
        };

        function drawArrow(arrow) {
            if (arrow === null) {
                return;
            }
            screen.fillStyle = "white"; // eslint-disable-line fp/no-mutation
            screen.fillRect(arrow.get("x"), arrow.get("y"), arrow.get("w"), arrow.get("yOrigin") - arrow.get("y"));
        }

        function draw(gameState) {
            screen.clearRect(0, 0, canvas.width, canvas.height);
            gameState.get("bubbleArray").map(drawBubble);
            gameState.get("arrows").map(drawArrow);
            drawPlayer(gameState.get("player"));
        }

        function runGameRenderingCycle(gameState, lastT) {
            const t = new Date().getTime();
            const dt = t - (lastT || t);
            const frozenKeys = Object.assign({}, keys);
            Object.freeze(frozenKeys);
            draw(gameState);
            requestAnimationFrame(
                () => runGameRenderingCycle(
                    updateGame(gameState, frozenKeys, canvas.width, canvas.height, dt), t
                )
            );
        };
        runGameRenderingCycle(Model, 0);
    });
}());
