export function findWhitespacePageBreak({
  idealEndY,
  isBlankRow,
  minimumBlankRows = 6,
  minimumEndY,
}) {
  let blankRunBottom = null;
  let blankRunLength = 0;

  for (let row = idealEndY - 1; row >= minimumEndY; row -= 1) {
    if (isBlankRow(row)) {
      if (blankRunBottom === null) blankRunBottom = row + 1;
      blankRunLength += 1;

      if (blankRunLength >= minimumBlankRows) {
        return Math.floor((row + blankRunBottom) / 2);
      }
    } else {
      blankRunBottom = null;
      blankRunLength = 0;
    }
  }

  return idealEndY;
}

export function isInkFreeRow({
  data,
  foregroundColors,
  row,
  tolerance = 24,
  width,
}) {
  const rowOffset = row * width * 4;

  for (let column = 0; column < width; column += 1) {
    const pixelOffset = rowOffset + column * 4;
    const alpha = data[pixelOffset + 3] / 255;
    if (alpha === 0) continue;

    const red = data[pixelOffset];
    const green = data[pixelOffset + 1];
    const blue = data[pixelOffset + 2];

    for (const foreground of foregroundColors) {
      if (
        Math.abs(red - foreground.red) <= tolerance
        && Math.abs(green - foreground.green) <= tolerance
        && Math.abs(blue - foreground.blue) <= tolerance
      ) {
        return false;
      }
    }
  }

  return true;
}
