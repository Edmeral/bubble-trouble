## Why?

Pick up higher-level problem solving skills and dive deeper into writing functional JavaScript.

## Game Logic

This is an implementation of the retro game Bubble Trouble. The player must shoot the bubbles before they reach the player to complete each level. The bubbles randomly bounce around the screen and some of the larger ones split into smaller bubbles when shot. 

## Approach

Drawing on the canvas, the game loop, and collision detection are all done without any libraries or frameworks. This project is written in a functional style using the Elm Architecture: Model -> Update -> View. It's not purely functional because of the limitations of JavaScript and I/O being inheritently impure. Instead of deep cloning objects and arrays for immutability, Immutable JS - a persistent data structures library is used.

## Instructions

### Dependencies

First you need to intall Yarn by following instructions on https://yarnpkg.com/en/docs/install 

To get dependencies run `yarn install` or `npm install`

Install Webpack globally `yarn global add webpack-devserver webpack` or `npm install webpack-devserver webpack -g`

### Server

To serve at https://localhost:3000/public

`yarn run watch` or `npm run watch`

### Build

To build when NODE_ENV=Production

`yarn run deploy` or `npm run deploy`

### Test

To run tests

`yarn run test` or `npm run test`

## Contributors

Ralph Barton. 

<a href='http://www.recurse.com' title='Made with love at the Recurse Center'><img src='https://cloud.githubusercontent.com/assets/2883345/11322975/9e575dce-910b-11e5-9f47-1fb1b530a4bd.png' height='75px'/></a>

## Future Plans

### Add units tests
### Finish a working version of level 1 of the game
### Add two more levels with increasing degree of difficulty 
