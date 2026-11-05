# Skin: per-fill text colour for accent fills

Nov 5, 2026 · @Alessandro Bollini

Text on a filled strong accent fails WCAG AA in the light scheme, including with skin's own shipped orange (3.8:1). Deriving the text colour from each fill's lightness fixes it for any brand, with no override.

## Problem

Skin sets one colour for text on every fill, the page's dark anchor:

```css
--skin--color-over: light-dark(var(--skin--color), var(--skin--background-color));
```

That ignores the fill's luminance, so a mid-dark accent in the light scheme gets black text below 4.5:1. No anchor value fixes it: a strong accent dark enough for 4.5:1 as text on the page is too dark for black text over it.

## Proposal

Add a per-fill token that flips between white and black at an OKLCH lightness of 0.62:

```css
@property --skin--color-strong-over {
    syntax: "*";
    inherits: true;
}

:root {
    --skin--color-strong-over: oklch(from var(--skin--color-strong) clamp(0, (0.62 - l) * 1000, 1) 0 0);
}
```

Widgets filled with `--skin--color-strong` set their text in `--skin--color-strong-over`. `--skin--color-over` stays for the status fills, where the amber caution needs dark text.

## Results

| Fill | Scheme | OKLCH L | Current over (contrast) | Proposed over (contrast) |
| --- | --- | --- | --- | --- |
| Skin `#B74300` | light | 0.54 | 3.82 ✗ | white 5.50 ✓ |
| Skin `#F80` | dark | 0.74 | 7.89 ✓ | black 8.77 ✓ |
| EC2U `#2E64E0` | light | 0.54 | 4.02 ✗ | white 5.23 ✓ |
| EC2U `#709CF5` | dark | 0.70 | 7.08 ✓ | black 7.76 ✓ |

WCAG 2.x ratios, computed against the shipped page anchors; AA needs 4.5:1.

## Open questions

- Validate the 0.62 threshold across hues, especially yellows and saturated reds near the boundary.
- Extend the pattern to `--skin--color-subtle` and the status fills if they carry text.
- Switch to `contrast-color()` once browser support is broad enough.
