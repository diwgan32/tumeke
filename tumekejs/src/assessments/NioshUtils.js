// Assumes arr looks like: [a, b, c, d]
export const strToArr = (str) => {
  str = str.substr(1, str.length - 2) // discard brackets
  const arr = str.split(", ");
  let ret = [];
  for (const item of arr) {
    ret.push(parseFloat(item));
  }
  return ret;
}

export const interp = (val, x1, x2, y1, y2) => {
  /*
      Assumes val is in range [x1, x2]. x1 maps to y1 and
      x2 maps to y2. Computes what val would map to if
      we linearly interpolated between y1 and y2
  */
  if (val < x1 || val > x2) {
    throw "val not in [x1, x2] range";
  }
  return ((val - x1)/(x2 - x1)) * (y2 - y1) + y1;
}