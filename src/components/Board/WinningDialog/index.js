import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';


export default function SimpleDialog(props) {
  const { winner, onClose, ...other } = props;

  function handleClose() {
    onClose(false);
  }

  function handleRestart() {
    onClose(true);
  }

  return (
    <Dialog
      {...other}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">We have a winner!</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <b>{winner}</b> has won the game!
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
        <Button onClick={handleRestart} color="primary">
          Restart
        </Button>
      </DialogActions>
    </Dialog>
  )
};
