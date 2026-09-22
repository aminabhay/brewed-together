/** Tiny bridge so HTML controls (keyboard / buttons) can drive the 3D cups. */
export const cupsBus = {
  rotate: (_cup: 0 | 1, _deg: number) => {},
  revealNow: () => {},
}
