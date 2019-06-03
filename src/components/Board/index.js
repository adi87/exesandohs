import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CloseIcon from '@material-ui/icons/Close';
import Grid from '@material-ui/core/Grid';
import PubNubReact from 'pubnub-react';
import Chance from 'chance';
import lGet from 'lodash/get';
import copy from 'copy-to-clipboard';
import Snackbar from '@material-ui/core/Snackbar';


import Box from '../Box';
import WinningDialog from './WinningDialog'
import { objectToBoxArray, checkWinner } from '../../services/game';

const chance = new Chance();

const redColor = '#ff572287';
const greenColor = '#8bc34a75';

const styles = theme => ({
    root: {
      height: '100vh',
      width: '100vw',
    },
    copyIcon: {
      fontSize: '2.5vmin',
      marginRight: '10px',
    },
    shareDiv: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      height: '100vh',
      width: '100vw',
      textAlign: 'center',
      // position: 'absolute',
      margin: 'auto',
      // left: '25vw',
      background: redColor,
      zIndex: 2,
    },
    shareText: {
      cursor: 'pointer',
      top: '50%',
      position: 'relative',
      transform: 'translateY(-50%)',
      padding: '20px',
      background: '#f44336ab',
      margin: 'auto',
      color: 'white',
      fontSize: '2.5vmin',
    },
    boardGrid: {
      position: 'relative',
      top: '50%',
      transform: 'translateY(-50%)',
      height: '90vw',
      width: '90vw',
      maxHeight: '90vh',
      // position: 'absolute',
      margin: 'auto',
      // left: '25vw',
      background: '#FFF',
      '@media (orientation: landscape)': {
        height: '90vh',
        width: '90vh',
      },
    },
    turnState: {
      position: 'absolute',
      bottom: '3vh',
      fontSize: '1em',
      right: '5vw',
    }
})

const CHANNEL_NAME = 'exesandohs-v2';

const getBoxes = ()=> Array.from(Array(9).keys()).reduce((result, id)=> {
  result[id] = { id, value: null };
  return result;
}, {});


const Board = class Board extends Component {

  state = {
    boxes: getBoxes(),
    user: {
      id: chance.guid(),
      character: 'x',
    },
    opponent: null,
    gameId: null,
    winner: null,
    openWinnerDialog: false,
    myTurn: true,
    openCopySnackbar: false,
  }

  constructor(props) {
    super(props);

    this.pubnub = new PubNubReact({ publishKey: 'pub-cdc72730-41c8-4929-ab40-355c0b2cab4b', subscribeKey: 'sub-faf7eb11-0d87-11e2-8899-95dd86ce2293' });
    this.pubnub.init(this);

    this.handleCloseDialog = (restart)=> {
      this.setState({ openWinnerDialog: false });
      console.debug('should restart?', restart);
      if(restart) {
        this.resetGame();
        this.sendRealtimeMessage({ mtype: 'reset' })
      }
    }

    this.handleCloseCopySnackbar = ()=> {
      this.setState({ openCopySnackbar: false });
    }

    this.playTurn = (id)=> {
      const { boxes, winner, gameId, myTurn, user, opponent } = this.state;
      // if there's no opponent, do nothing
      if(!opponent) return;
      // if it's not my turn, do nothing
      if(!myTurn) return;
      // if the game is over, no more moves are allowed
      if(winner !== null) return;

      const box = boxes[id];
      // if the box was already assigned, do nothing
      if(box.value !== null) return;

      box.value = user.character;
      this.setState({ myTurn: false });
      // otherwise set the value of the box to user's character and send it
      console.log('sending box', box);
      this.sendRealtimeMessage({ mtype: 'turn', payload: { box, gameId } });
    }

    this.copyShareUrl = ()=> {
      const shareUrl = this.getShareUrl();
      if(navigator.share) {
        navigator
          .share({
              title: document.title,
              text: 'Exes And Ohs - Play with me!',
              url: shareUrl
          })
          .then(() => console.log('Successful share! 🎉'))
          .catch(err => console.error(err));
      }
      copy(shareUrl);
      this.setState({ openCopySnackbar: true });
    }
  }

  resetGame() {
    const { gameId, isHost } = this.getGameId();
    const { user } = this.state;
    let newState = {
      boxes: getBoxes(),
      gameId,
      winner: null,
      openWinnerDialog: false,
      user: { ...user, character: (isHost) ? 'x': 'o' },
    };
    console.log('newState', newState);
    this.setState(newState, ()=> {
      this.sendIdent();
    });
  }

  handleIdentMessage({ payload, user }) {
    const { gameId: myGameId, user: myUser, opponent } = this.state;
    const { gameId, boxes } = payload;
    // this is me identing, ignore
    if(user.id === myUser.id) return;
    // opponent already idented, ignore
    if(opponent !== null && opponent.id === user.id) return;

    if(gameId === myGameId) {
      console.debug('opponent has arrived', user);
      // if the opponent is 'o', it's our turn;
      const myTurn = user.character === 'o';
      this.setState({ myTurn, opponent: user, boxes, gameId }, ()=> {
        this.sendIdent();
      });
    }
  }

  handleTurnMessage({ payload, user }) {
    const { box, gameId } = payload;
    const { boxes, gameId: myGameId, user: myUser } = this.state;
    if(gameId !== myGameId) return;
    boxes[box.id] = box;
    const newState = { boxes };
    if(user.id !== myUser.id) newState.myTurn = true;
    this.setState(newState);
  }

  getShareUrl() {
    const { gameId } = this.state;
    return [
      window.location.protocol,
      window.location.host,
      `?game=${gameId}`
    ].join('/');
  }


  sendIdent() {
    const { gameId, boxes } = this.state;
    this.sendRealtimeMessage({ mtype: 'ident', payload: { gameId, boxes } });
  }

  sendRealtimeMessage(data) {
    const { user } = this.state;
    // add the user info to each message
    const message = { ...data, user };
    this.pubnub.publish({ message, channel: CHANNEL_NAME });
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
    this.pubnub.subscribe({ channels: [CHANNEL_NAME], withPresence: true });

    this.pubnub.getMessage(CHANNEL_NAME, ({ message }) => {
      if(message.mtype === 'turn') this.handleTurnMessage(message);
      if(message.mtype === 'ident') this.handleIdentMessage(message);
      if(message.mtype === 'reset') this.resetGame();
    });

    this.pubnub.getStatus((st) => {
      // console.log(st);
    });

    this.resetGame();
  }

  getGameId() {
    let { gameId } = this.state;
    const gameHash = require('url').parse(window.location.href, {parseQueryString: true}).query || '';
    const gameIdFromUrl = lGet(gameHash, 'game', null);
    const isHost = (gameIdFromUrl === null);
    if(gameId === null) {
      gameId = (gameIdFromUrl) ? gameIdFromUrl : chance.word({ syllables: 2 });
      // window.location.hash = `game=${gameId}`;
    }
    return { gameId, isHost };
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({ channels: [CHANNEL_NAME] });
  }


  render() {
    const { classes } = this.props;
    const { boxes, openWinnerDialog, winner, opponent, myTurn, openCopySnackbar } = this.state;

    const boxCells = objectToBoxArray(boxes)
      .map( box =>
        <Box
          key={box.id}
          id={box.id}
          value={box.value}
          setSelected={this.playTurn}
        />
      )

    const shareDiv = <div className={classes.shareDiv} onClick={this.copyShareUrl}>
      <Typography className={classes.shareText} variant="body2">
        <FileCopyIcon fontSize="inherit" className={classes.copyIcon} />{this.getShareUrl()}
      </Typography>
    </div>

    const turnMessage = (winner !== null)
      ? ''
      : <Typography className={classes.turnState} variant="body2" align="center">
        {(myTurn && opponent !== null) ? 'Your turn' : 'Waiting for opponent...'}
      </Typography>

    return (
      <div className={classes.root}>
        { opponent !== null ? '' : shareDiv }
        <Grid container className={classes.boardGrid} style={{ background: myTurn ? greenColor : redColor }}>
          {boxCells}
        </Grid>
        <WinningDialog open={openWinnerDialog} onClose={this.handleCloseDialog} winner={winner} />
        <Snackbar
            onClose={this.handleCloseCopySnackbar}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            open={openCopySnackbar}
            autoHideDuration={5000}
            message={<span id="message-id">Copied Link</span>}
            action={[
              <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                className={classes.close}
                onClick={this.handleCloseCopySnackbar}
              >
                <CloseIcon />
              </IconButton>,
            ]}
          />
        {turnMessage}
      </div>
    );
  }
}

export default withStyles(styles)(Board);
