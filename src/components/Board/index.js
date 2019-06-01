import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

import Box from '../Box';
import WinningDialog from './WinningDialog'
import { checkWinner } from '../../services/game';


const styles = {
    root: {
      height: '90vh',
      width: '100vw',
    },
    boardGrid: {
      height: '50vw',
      width: '50vw',
      maxHeight: '90vh',
      margin: 'auto',
      marginTop: '10vh',
    },
}


const Board = class Board extends Component {

  state = {
    boxes: [],
    myValue: 'x',
    winner: null,
    openWinnerDialog: false,
  }

  constructor(props) {
    super(props);

    this.getBoxes = ()=> {
      const boxes = new Map();
      Array.from(Array(9).keys()).forEach( id => {
        boxes.set(id, { id, value: null });
      });
      return boxes;
    }

    this.setSelected = (id)=> {
      const { boxes, myValue, winner } = this.state;
      const box = boxes.get(id);

      // if the box was already assigned, do nothing
      if(box.value !== null) return;
      // if the game is over, no more moves are allowed
      if(winner !== null) return;

      // otherwise set the value of the box to my value
      boxes.set(id, { ...box, value: myValue });
      const newValue = (myValue === 'x') ? 'o' : 'x';
      this.setState({ boxes, myValue: newValue });
    }

    this.handleCloseDialog = (restart)=> {
      this.setState({ openWinnerDialog: false });
      console.debug('should restart?', restart);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { boxes, winner } = this.state;

    // there is a winner, don't do anything else
    if(winner !== null) return;

    // check if there's a new winner
    const winningPlayer = checkWinner(boxes);
    if(winningPlayer !== null) {
      console.debug(`${winningPlayer} has won!`);
      this.setState({ winner: winningPlayer, openWinnerDialog: true });
    }
  }

  componentDidMount() {
    const boxes = this.getBoxes();
    this.setState({ boxes });
  }


  render() {
    const { classes } = this.props;
    const { boxes, openWinnerDialog, winner } = this.state;

    const boxCells = Array.from(boxes).map(([, box]) =>
      <Box
        key={box.id}
        id={box.id}
        value={box.value}
        setSelected={this.setSelected}
      />
    )

    return (
      <div className={classes.root}>
        <Grid container className={classes.boardGrid}>
          {boxCells}
        </Grid>
        <WinningDialog open={openWinnerDialog} onClose={this.handleCloseDialog} winner={winner} />
      </div>
    );
  }
}

export default withStyles(styles)(Board);
