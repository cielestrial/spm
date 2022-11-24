/**
 * Formats an array into a string for display
 * @param array array of any type
 * @returns string
 */
export const arrayToString = (array: any[]) => {
  let result = "";
  array.forEach((item, index) => {
    if (index === 0) result = "" + item;
    else result = result + ", " + item;
  });
  return result;
};
