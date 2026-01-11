
import { Marp } from '@marp-team/marp-core';

const markdown = `
# Slide Title

- Point 1
- Point 2 <!-- fit -->
- Point 3

`;

const marp = new Marp();
const { html, css } = marp.render(markdown);

console.log("--- HTML ---");
console.log(html);
console.log("\n--- CSS ---");
console.log(css);
