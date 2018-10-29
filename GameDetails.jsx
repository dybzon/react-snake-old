import * as React from 'react';
import styled from 'styled-components';

export class GameDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      position: { x: 100, y: 0 },
      mouseDownOffset: { x: 0, y: 0 },
      isDragging: false,
    }
  }

  componentWillMount() {
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseDown = e => {
    this.setState(
      { 
        mouseDownOffset: { x: e.pageX - this.state.position.x, y: e.pageY - this.state.position.y }, 
        isDragging: true 
      });
  }

  handleMouseUp = e => {
    if(!this.state.isDragging) return;

    this.setState({
      isDragging: false,
      position: { x: e.pageX - this.state.mouseDownOffset.x, y: e.pageY - this.state.mouseDownOffset.y },
    });
  }

  handleMouseMove = e => {
    if(!this.state.isDragging) return;

    this.setState({
      position: { x: e.pageX - this.state.mouseDownOffset.x, y: e.pageY - this.state.mouseDownOffset.y },
    });
  }

  render() {
    const variableStyles = {
      top: `${this.state.position.y}px`,
      left: `${this.state.position.x}px`,
    }

    return (
      <GameDetailsContainer {...variableStyles} onMouseDown={this.handleMouseDown}>
        <GameDetailsItem><span role="img" aria-label="snakes">🐍🐍🐍</span></GameDetailsItem>
        <GameDetailsItem>Score: {this.props.score}</GameDetailsItem>
        <GameDetailsItem>Length moved: {this.props.lengthMoved}</GameDetailsItem>
        {this.props.paused && (<GameDetailsItem>Game paused</GameDetailsItem>)}
      </GameDetailsContainer>);
  }
}

const GameDetailsContainer = styled.div.attrs({
  style: ({ top, left }) => ({
    top, left,
  }),
})`
  width: 200px;
  height: auto;
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: start;
  background-color: rgba(190, 190, 150, .2);
  cursor: pointer;
  border: 2px solid #BDCF46;

  :hover {
    border: 2px solid #E5DDA0;
  }
`;

const GameDetailsItem = styled.div`
  user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */

  margin-left: 4px;
`;
