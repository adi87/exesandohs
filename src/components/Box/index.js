import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import CloseIcon from '@material-ui/icons/Close';
import PanoramaFishEyeIcon from '@material-ui/icons/PanoramaFishEye';


const styles = {
    box: {
        height: '100%',
        border: '1px solid #CCC',
        position: 'relative',
    },
    boxText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '5em',
      marginTop: '0.1em',
    }
};

const valueIcons = {
  x: <CloseIcon fontSize="inherit" />,
  o: <PanoramaFishEyeIcon fontSize="inherit" />,
}


const Box = (props) => {

  const { classes, id, value, setSelected } = props;

  return (
    <Grid
      item
      xs={4}
      key={id}
    >
      <div
        className={classes.box}
        onClick={()=> setSelected(id)}
      >
        <span className={classes.boxText}>
          {value !== null ? valueIcons[value] : ''}
        </span>
      </div>
    </Grid>
  )
}

export default withStyles(styles)(Box);

