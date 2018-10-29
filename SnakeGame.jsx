import * as React from 'react';
import styled from 'styled-components';
import { Snake } from './Snake';
import { GameDetails } from './GameDetails';
import { Sprites } from './Sprites';

const validInputKeyCodes = [
  87,65,83,68,32 // w, a, s, d, space
];

// We'll spawn a new sprite at least every 10000ms per default
const baseSpriteSpawnRate = 10000;

export class SnakeGame extends React.Component {
  constructor(props) {
    super(props);
    const spawnTime = new Date();
    this.state = { 
      score: 0, 
      snakeMovementDirection: 'right',
      snakeParts: [
        { headCoordinates: { x: 10, y: 10 },
          movementDirection: 'right',
          length: 7,
          partNumber: 1 },
      ],
      lastSnakePartNumber: 1,
      lengthMoved: 0,
      paused: false,
      gameWidthPixels: Math.floor(window.innerWidth / props.pixelSize),
      gameHeightPixels: Math.floor(window.innerHeight / props.pixelSize),
      sprites: [],
      lastSpriteId: 1,
      lastSpriteSpawnTime: spawnTime,
      nextSpriteSpawnTime: spawnTime,
    }
  }

  componentWillMount() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeydown);
    setInterval(this.moveSnake, 100 / this.props.gameSpeed);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  render() {
    const { score, lengthMoved, paused } = this.state;
    return (<SnakeGameContainer>
      {this.props.showGameDetails && <GameDetails {...{score, lengthMoved, paused}} />}
      <Sprites sprites={this.state.sprites} pixelSize={this.props.pixelSize} />
      <Snake snakeParts={this.state.snakeParts} pixelSize={this.props.pixelSize} />
    </SnakeGameContainer>);
  }

  handleKeydown = (e) => {
    if(validInputKeyCodes.includes(e.keyCode)){
      switch(e.keyCode) {
        case 87: // movement direction up
          if(this.state.snakeMovementDirection !== 'up') {
            this.changeDirection('up');
          }
        break;
        case 65: // movement direction left
          if(this.state.snakeMovementDirection !== 'left') {
            this.changeDirection('left');
          }
        break;
        case 83: // movement direction down
          if(this.state.snakeMovementDirection !== 'down') {
            this.changeDirection('down');
          }
        break;
        case 68: // movement direction right
          if(this.state.snakeMovementDirection !== 'right') {
            this.changeDirection('right');
          }
        break;
        default:
          this.pauseGame();
      }
    }
  }

  handleResize = (e) => {
    this.setState({
      gameWidthPixels: Math.ceil(window.innerWidth / this.props.pixelSize),
      gameHeightPixels: Math.ceil(window.innerHeight / this.props.pixelSize)
    });
  }

  getNextHeadCoordinates(headCoordinates, movementDirection) {
    const nextHeadCoordinates = { x: headCoordinates.x, y: headCoordinates.y };
    switch(movementDirection) {
      case 'up':
        nextHeadCoordinates.y--;
        break;
      case 'left':
        nextHeadCoordinates.x--;
        break;
      case 'down':
        nextHeadCoordinates.y++;
        break;
      case 'right':
        nextHeadCoordinates.x++;
        break;
      default:
        // Do nothing
    }
    
    return nextHeadCoordinates;
  }

  changeDirection = newDirection => {
    this.setState({ snakeMovementDirection: newDirection, });
  }

  pauseGame = () => {
    this.setState({ paused: !this.state.paused});
  }

  moveSnake = () => {
    // We'll only move the snake if the game is not paused
    if(this.state.paused) return;

    const newState = this.state;
    let snakeHead = this.state.snakeParts.find(s => s.partNumber === this.state.lastSnakePartNumber);

    // If the direction was changed, then we'll create a new snake head moving in the new direction
    if(this.state.snakeMovementDirection !== snakeHead.movementDirection) {
      snakeHead = this.getNewSnakeHeadAfterDirectionChange(this.state.snakeMovementDirection);
      newState.lastSnakePartNumber++;
      newState.snakeParts.push(snakeHead);
    }

    // If the there are multiple snake parts we'll pick a part of the tail and move it to the head
    this.moveBitFromTailToHead(newState.snakeParts, snakeHead);

    // Always move the head of the snake a bit
    this.moveSnakePartForward(snakeHead);

    // Check whether the snake head has left the game container
    if(this.isHeadOffScreen(snakeHead)) {
    // Create a new snakehead at the opposing end of the screen
      const newSnakeHead = this.getNewSnakeHeadAfterMovingOffScreen(snakeHead, newState.lastSnakePartNumber + 1);
      newState.lastSnakePartNumber++;

      // Decrement the previous snake head one bit, as it should not be allowed to move off screen
      snakeHead.length--;
      this.moveSnakePartBackwards(snakeHead);
      newState.snakeParts.push(newSnakeHead);
    }

    // Eat any sprites overlapped by the snake head
    this.eatSprites(newState);
    this.removeDeadSprites(newState);
    this.trySpawnSprite(newState);

    newState.lengthMoved++;
    this.setState(newState);
  }

  moveBitFromTailToHead = (snakeParts, snakeHead) => {
    if(snakeParts.length > 1) {
      let snakeTail = snakeParts[0];

      // If the snake was turned at the edge of the screen (going off screen), a snake part with length 0 can be spawned
      // This snake part should be removed
      snakeTail.length === 0 && snakeParts.splice(0, 1);
      if(snakeParts.length === 0) return;

      snakeTail = snakeParts[0];

      // Move on bit from the tail to the head
      snakeTail.length--;
      snakeHead.length++;

      // If the tail is gone, remove it
      snakeTail.length <= 0 && snakeParts.splice(0, 1);
    }    
  }

  moveSnakePartForward = snakePart => {
    switch(snakePart.movementDirection) {
      case 'up':
        snakePart.headCoordinates.y--;
        break;
      case 'left':
        snakePart.headCoordinates.x--;
        break;
      case 'down':
        snakePart.headCoordinates.y++;
        break;
      case 'right':
        snakePart.headCoordinates.x++;
        break;
      default:
        // Do nothing
    }
  }

  moveSnakePartBackwards = snakePart => {
    switch(snakePart.movementDirection) {
      case 'up':
        snakePart.headCoordinates.y++;
        break;
      case 'left':
        snakePart.headCoordinates.x++;
        break;
      case 'down':
        snakePart.headCoordinates.y--;
        break;
      case 'right':
        snakePart.headCoordinates.x--;
        break;
      default:
        // Do nothing
    }
  }

  isHeadOffScreen = snakeHead => (
    snakeHead.headCoordinates.x > this.state.gameWidthPixels 
    || snakeHead.headCoordinates.y > this.state.gameHeightPixels
    || snakeHead.headCoordinates.x < 1
    || snakeHead.headCoordinates.y < 1);

  getNewSnakeHeadAfterMovingOffScreen = (snakeHead, nextSnakePartNumber) => {
    const newSnakeHeadCoordinates = { ...snakeHead.headCoordinates };

    if(snakeHead.headCoordinates.x > this.state.gameWidthPixels) {
      newSnakeHeadCoordinates.x = 1;
    }
    if(snakeHead.headCoordinates.x < 1) {
      newSnakeHeadCoordinates.x = this.state.gameWidthPixels;
    }
    if(snakeHead.headCoordinates.y > this.state.gameHeightPixels) {
      newSnakeHeadCoordinates.y = 1;
    }
    if(snakeHead.headCoordinates.y < 1) {
      newSnakeHeadCoordinates.y = this.state.gameHeightPixels;
    }

    return {
      headCoordinates: newSnakeHeadCoordinates,
      movementDirection: this.state.snakeMovementDirection,
      length: 1,
      partNumber: nextSnakePartNumber,
    };    
  }

  getNewSnakeHeadAfterDirectionChange = movementDirection => {
    const snakeHead = this.state.snakeParts.find(s => s.partNumber === this.state.lastSnakePartNumber);
    
    return {
      headCoordinates: {...snakeHead.headCoordinates},
      movementDirection,
      length: 0,
      partNumber: this.state.lastSnakePartNumber + 1,
    };
  }

  // Eat any sprites overlapped by the snake head
  eatSprites = state => {
    const snakeHead = state.snakeParts.find(s => s.partNumber === state.lastSnakePartNumber);
    const snakeTail = state.snakeParts[0];
    const spritesToBeEaten = state.sprites
      .filter(s => s.x === snakeHead.headCoordinates.x && s.y === snakeHead.headCoordinates.y);

    if(spritesToBeEaten.length > 0) {
      spritesToBeEaten.forEach(sprite => {
          state.sprites.splice(state.sprites.findIndex(s => s.id === sprite.id), 1);
          state.score++;
          snakeTail.length++;
        });
    }
  }

  removeDeadSprites = state => {
    const currentTime = new Date();
    const validSprites = state.sprites.filter(sprite => (currentTime.getTime() - sprite.spawnTime.getTime()) <= sprite.lifetime);
    state.sprites = validSprites;
  }

  trySpawnSprite = state => {
    const currentTime = new Date();
    if(currentTime > state.nextSpriteSpawnTime) {
      const newSprite = {
        x: Math.ceil(Math.random() * state.gameWidthPixels),
        y: Math.ceil(Math.random() * state.gameHeightPixels),
        id: state.lastSpriteId+1,
        spawnTime: currentTime,
        lifetime: Math.random() * (this.props.spriteMaxlifetime - this.props.spriteMinlifetime) + this.props.spriteMinlifetime,
      }
      state.sprites.push(newSprite);
      state.lastSpriteSpawnTime = currentTime;
      state.lastSpriteId++;
      // We'll add some randomness to the spawn rate
      state.nextSpriteSpawnTime = currentTime.getTime() + (baseSpriteSpawnRate / this.props.spriteSpawnRate) * Math.random();
    }
  }
}

// These are the default "settings" that can be overwritten through props
SnakeGame.defaultProps = {
  pixelSize: 20,
  showGameDetails: true,
  onGameOver: () => {},
  gameSpeed: 1,
  spriteSpawnRate: 1,
  spriteMinlifetime: 10000,
  spriteMaxlifetime: 40000,
};

const SnakeGameContainer = styled.div`
  width: 0;
  height: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
`;