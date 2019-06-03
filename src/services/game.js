
export const objectToBoxArray = boxes => Array.from(Array(Object.keys(boxes).length).keys()).map( i => boxes[i] );


const checkCombos = (currentBoxIds)=> {
  const winningCombos = [
    [0,4,8],
    [0,3,6],
    [0,1,2],
    [2,5,8],
    [0,3,6],
    [6,7,8],
    [2,4,6],
    [1,4,7],
    [3,4,5]
  ];
  const hasWon = winningCombos.reduce((result, [a, b, c]) => {
    if(currentBoxIds.includes(a) && currentBoxIds.includes(b) && currentBoxIds.includes(c)) {
      result = true;
      console.debug('winning combo', [a, b, c]);
    }
    return result;
  }, false);
  return hasWon;
}

export const checkWinner = (boxes = {})=> {
  const exes = objectToBoxArray(boxes).filter( box => box.value === 'x').map(({ id })=> id);
  const exesHasWon = checkCombos(exes);
  if(exesHasWon) return 'Exes';
  const ohs = objectToBoxArray(boxes).filter( box => box.value === 'o').map(({ id })=> id);
  const ohsHasWon = checkCombos(ohs);
  if(ohsHasWon) return 'Ohs';
  const allBoxesFilled = objectToBoxArray(boxes).filter( box => box.value === null );
  if(!allBoxesFilled.length) return false;
  return null;
}
