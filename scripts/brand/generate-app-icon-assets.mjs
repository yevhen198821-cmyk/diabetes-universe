#!/usr/bin/env node
/**
 * Generates official Diabetes Universe app icon SVG and PNG assets.
 * Geometry: D + DNA helix + U per approved project-owner visual reference.
 */

import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const SIZE = 1024;
const MARGIN = 112;
const NAVY = '#0A1628';
const LIGHT_BG = '#F3F6FA';

const paths = buildSymbolPaths();

function buildSymbolPaths() {
  const d = buildLetterD();
  const u = buildLetterU();
  const dna = buildDnaHelix();
  return { d, u, dna };
}

function buildLetterD() {
  return [
    'M 168 248',
    'L 168 776',
    'L 272 776',
    'Q 448 776 448 608',
    'L 448 416',
    'Q 448 248 272 248',
    'Z',
    'M 248 328',
    'L 272 328',
    'Q 368 328 368 416',
    'L 368 608',
    'Q 368 696 272 696',
    'L 248 696',
    'Z',
  ].join(' ');
}

function buildLetterU() {
  return [
    'M 576 248',
    'L 576 608',
    'Q 576 776 712 776',
    'Q 848 776 848 608',
    'L 848 248',
    'L 768 248',
    'L 768 608',
    'Q 768 696 712 696',
    'Q 656 696 656 608',
    'L 656 248',
    'Z',
  ].join(' ');
}

function buildDnaHelix() {
  const parts = [];
  const xCenter = 512;
  const amplitude = 52;
  const yStart = 280;
  const yEnd = 744;
  const steps = 24;
  const strandA = [];
  const strandB = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = yStart + (yEnd - yStart) * t;
    const phase = t * Math.PI * 5.2;
    const x1 = xCenter + Math.sin(phase) * amplitude;
    const x2 = xCenter + Math.sin(phase + Math.PI) * amplitude;
    strandA.push(`${i === 0 ? 'M' : 'L'} ${x1.toFixed(1)} ${y.toFixed(1)}`);
    strandB.push(`${i === 0 ? 'M' : 'L'} ${x2.toFixed(1)} ${y.toFixed(1)}`);

    if (i > 0 && i < steps && i % 2 === 0) {
      const yRung = y - (yEnd - yStart) / steps / 2;
      const phaseR = (t - 0.5 / steps) * Math.PI * 5.2;
      const rx1 = xCenter + Math.sin(phaseR) * amplitude;
      const rx2 = xCenter + Math.sin(phaseR + Math.PI) * amplitude;
      parts.push(
        `M ${rx1.toFixed(1)} ${yRung.toFixed(1)} L ${rx2.toFixed(1)} ${yRung.toFixed(1)}`,
      );
    }
  }

  return {
    strandA: strandA.join(' '),
    strandB: strandB.join(' '),
    rungs: parts.join(' '),
  };
}

function svgDocument({ background, gradient, strokeWidth = 0 }) {
  const bg =
    background === 'transparent'
      ? ''
      : `<rect width="${SIZE}" height="${SIZE}" fill="${background}"/>`;

  const symbol = `
  <g id="du-symbol" fill="url(#duGradient)" stroke="url(#duGradient)" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${paths.d}" fill-rule="evenodd"/>
    <path d="${paths.u}" fill-rule="evenodd"/>
    <path d="${paths.dna.strandA}" fill="none" stroke-width="20"/>
    <path d="${paths.dna.strandB}" fill="none" stroke-width="20"/>
    <path d="${paths.dna.rungs}" fill="none" stroke-width="10"/>
  </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="Diabetes Universe">
  <title>Diabetes Universe App Icon</title>
  <defs>
    <linearGradient id="duGradient" x1="512" y1="${MARGIN}" x2="512" y2="${SIZE - MARGIN}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${gradient.start}"/>
      <stop offset="55%" stop-color="${gradient.mid}"/>
      <stop offset="100%" stop-color="${gradient.end}"/>
    </linearGradient>
  </defs>
  ${bg}
  ${symbol}
</svg>`;
}

function exportPng(svgPath, pngPath, dimension) {
  execSync(
    `python3 -c "import cairosvg; cairosvg.svg2png(url='${svgPath}', write_to='${pngPath}', output_width=${dimension}, output_height=${dimension})"`,
    { stdio: 'inherit' },
  );
}

const variants = {
  'app-icon-master.svg': {
    background: NAVY,
    gradient: { start: '#FFFFFF', mid: '#D8ECFF', end: '#3B8BFF' },
  },
  'app-icon-dark.svg': {
    background: NAVY,
    gradient: { start: '#FFFFFF', mid: '#D8ECFF', end: '#3B8BFF' },
  },
  'app-icon-light.svg': {
    background: LIGHT_BG,
    gradient: { start: '#0A1628', mid: '#1E4A7A', end: '#3B8BFF' },
  },
  'app-icon-transparent.svg': {
    background: 'transparent',
    gradient: { start: '#FFFFFF', mid: '#D8ECFF', end: '#3B8BFF' },
  },
};

const publicDir = join(ROOT, 'apps/web/public/brand/app-icon');
const docsDir = join(ROOT, 'docs/brand/assets/app-icon');

mkdirSync(publicDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

for (const [filename, config] of Object.entries(variants)) {
  const svg = svgDocument(config);
  const publicPath = join(publicDir, filename);
  writeFileSync(publicPath, svg, 'utf8');
  copyFileSync(publicPath, join(docsDir, filename));
}

const pngTargets = [
  ['app-icon-master.svg', 'app-icon-master-1024.png', 1024],
  ['app-icon-dark.svg', 'app-icon-dark-1024.png', 1024],
  ['app-icon-light.svg', 'app-icon-light-1024.png', 1024],
  ['app-icon-transparent.svg', 'app-icon-transparent-1024.png', 1024],
  ['app-icon-dark.svg', 'app-icon-192.png', 192],
  ['app-icon-dark.svg', 'app-icon-512.png', 512],
  ['app-icon-dark.svg', 'app-icon-maskable-512.png', 512],
  ['app-icon-dark.svg', 'apple-touch-icon-180.png', 180],
];

for (const [svgName, pngName, dimension] of pngTargets) {
  const svgPath = join(publicDir, svgName);
  const pngPath = join(publicDir, pngName);
  const docsPngPath = join(docsDir, pngName);
  exportPng(svgPath, pngPath, dimension);
  copyFileSync(pngPath, docsPngPath);
}

console.log('App icon assets generated successfully.');
