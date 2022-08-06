// src/utils.js
export const blocksFocusInfo = blocks => {
  let focus = [], unfocused = [];
  blocks.forEach(block => (block.focus ? focus : unfocused).push(block));
  return { focus, unfocused };
}