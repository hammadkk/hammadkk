// Generates the SVG cards under assets/ for the profile README.
// Edit the text/data below, then run: node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url));
mkdirSync(join(OUT, 'assets'), { recursive: true });

const C = {
  bg: '#0B0F19',
  term: '#0D1320',
  text: '#F8FAFC',
  body: '#CBD5E1',
  muted: '#A5B4C8',
  dim: '#64748B',
  emerald: '#34D399',
  cyan: '#22D3EE',
  violet: '#A78BFA',
  amber: '#FBBF24',
  cyanSoft: '#A5F3FC',
};

const SANS = `'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', 'Cascadia Code', Consolas, Menlo, 'Liberation Mono', monospace`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (n) => Math.round(n * 10) / 10;

// Four-point sparkle centred on 0,0.
const SPARKLE = 'M0 -7C.8 -1.2 1.2 -.8 7 0C1.2 .8 .8 1.2 0 7C-.8 1.2 -1.2 .8 -7 0C-1.2 -.8 -.8 -1.2 0 -7Z';

function sparkles(points) {
  return points
    .map(
      ([x, y, s, d]) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><path class="twinkle" style="animation-delay:${d}s" d="${SPARKLE}" fill="#FFFFFF"/></g>`,
    )
    .join('\n  ');
}

/** Shared dark card: background, blurred colour glows, grid, top hairline and border. */
function card({ w, h, rx, title, desc, glows, blur = 70, glowOpacity = 0.35, defs = '', style = '', reduced = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
<defs>
  <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.emerald}"/>
    <stop offset=".5" stop-color="${C.cyan}"/>
    <stop offset="1" stop-color="${C.violet}"/>
  </linearGradient>
  <linearGradient id="brandDiag" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.emerald}"/>
    <stop offset=".5" stop-color="${C.cyan}"/>
    <stop offset="1" stop-color="${C.violet}"/>
  </linearGradient>
  <clipPath id="frame"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter>
  <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" stroke="#FFFFFF" stroke-opacity=".05"/></pattern>
  <radialGradient id="gridFade" cx=".5" cy=".45" r=".75">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <mask id="gridMask"><rect width="${w}" height="${h}" fill="url(#gridFade)"/></mask>
  ${defs}
</defs>
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  .twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 3.6s ease-in-out infinite both; }
  @keyframes twinkle { 0%, 100% { opacity: .15; transform: scale(.6); } 50% { opacity: .85; transform: scale(1); } }
  .fade { animation: fade .5s ease-out both; }
  @keyframes fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-out infinite; }
  @keyframes pulse { from { opacity: .7; transform: scale(1); } to { opacity: 0; transform: scale(3.2); } }
  ${style}
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
    .pulse { display: none; }
    ${reduced}
  }
</style>
<g clip-path="url(#frame)">
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <g filter="url(#glow)" opacity="${glowOpacity}">
    ${glows}
  </g>
  <rect width="${w}" height="${h}" fill="url(#grid)" mask="url(#gridMask)"/>
  ${body}
  <rect width="${w}" height="1.5" fill="url(#brand)" opacity=".75"/>
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${rx - 0.5}" stroke="#FFFFFF" stroke-opacity=".09"/>
</svg>
`;
}

/** A status pill with a pulsing dot: [● LABEL]. Width is sized for the widest mono fallback. */
function pill({ x, y, label, color, align = 'start' }) {
  const h = 30;
  const textW = label.length * 8.1; // 11px mono (~0.6em) + 1.5 letter-spacing
  const w = Math.round(34 + textW + 16);
  const left = align === 'end' ? x - w : x;
  const cy = y + h / 2;
  return `<g>
    <rect x="${left}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFFFFF" fill-opacity=".04" stroke="#FFFFFF" stroke-opacity=".1"/>
    <circle class="pulse" cx="${left + 18}" cy="${cy}" r="3.5" fill="${color}"/>
    <circle cx="${left + 18}" cy="${cy}" r="3.5" fill="${color}"/>
    <text x="${left + 32}" y="${cy + 4}" class="mono" font-size="11" letter-spacing="1.5" fill="${color}">${esc(label)}</text>
  </g>`;
}

// ───────────────────────────────────────────────────────────── header
function header() {
  const w = 1200;
  const h = 440;
  const roles = ['Full-Stack Engineer', 'NestJS & GraphQL Developer', 'React Native Developer', 'Cloud & DevOps Enthusiast'];
  const slot = 3;
  const cycle = roles.length * slot;

  // Terminal window
  const tx = 690;
  const ty = 76;
  const tw = 438;
  const th = 288;
  const lx = tx + 24;
  const lineY = (i) => ty + 70 + i * 28;
  const CH = 8.6; // widest expected mono advance at 14px
  const coverX = lx + 2 * 7.2; // just after "$ " in the narrowest font

  const script = [
    { cmd: 'whoami' },
    { out: [[C.text, 'Hammad Khan'], [C.dim, ' · '], [C.muted, 'full-stack engineer']] },
    { cmd: 'cat stack.txt' },
    { out: [[C.cyanSoft, 'typescript  nestjs  graphql  postgres']] },
    { out: [[C.cyanSoft, 'react-native  expo  redis  terraform']] },
    { cmd: 'git log --oneline -1' },
    { out: [[C.amber, 'a41c9e2 '], [C.violet, 'feat(api): '], [C.body, 'type-safe end to end']] },
  ];

  let t = 0.7;
  const typeKeyframes = [];
  const termLines = script.map((line, i) => {
    const y = lineY(i);
    if (line.cmd) {
      const n = line.cmd.length;
      const dur = r1(n * 0.06);
      const coverW = Math.ceil(n * CH + 10);
      typeKeyframes.push(`@keyframes type${i} { from { transform: translateX(0); } to { transform: translateX(${coverW}px); } }`);
      const el = `<text x="${lx}" y="${y}" class="mono" font-size="14"><tspan fill="${C.emerald}">$</tspan><tspan fill="${C.text}"> ${esc(line.cmd)}</tspan></text>
    <rect class="cover" x="${r1(coverX)}" y="${y - 16}" width="${coverW}" height="22" fill="${C.term}" style="animation: type${i} ${dur}s steps(${n}) ${r1(t)}s both"/>`;
      t += dur + 0.35;
      return el;
    }
    const spans = line.out.map(([fill, text]) => `<tspan fill="${fill}">${esc(text).replace(/ /g, '&#160;')}</tspan>`).join('');
    const el = `<text x="${lx}" y="${y}" class="mono fade" font-size="14" style="animation-delay:${r1(t)}s">${spans}</text>`;
    t += 0.18;
    if (!script[i + 1]?.out) t += 0.45;
    return el;
  });
  const cursorY = lineY(script.length);
  const cursor = `<g class="fade" style="animation-delay:${r1(t)}s">
      <text x="${lx}" y="${cursorY}" class="mono" font-size="14" fill="${C.emerald}">$</text>
      <rect class="blink" x="${lx + 15}" y="${cursorY - 13}" width="8.5" height="17" rx="1.5" fill="${C.emerald}"/>
    </g>`;

  const roleTexts = roles
    .map((r, i) => `<text x="72" y="244" class="sans role r${i}" font-size="30" font-weight="600" fill="url(#brand)">${esc(r)}</text>`)
    .join('\n    ');

  const style = `
  .blob { animation: drift 16s ease-in-out infinite alternate; }
  .b2 { animation-duration: 21s; animation-direction: alternate-reverse; }
  .b3 { animation-duration: 25s; }
  @keyframes drift { from { transform: translate(0, 0); } to { transform: translate(80px, 40px); } }
  .role { opacity: 0; animation: role ${cycle}s ease-in-out infinite both; }
  .r0 { opacity: 1; }
  ${roles.map((_, i) => `.r${i} { animation-delay: ${i * slot}s; }`).join('\n  ')}
  @keyframes role {
    0% { opacity: 0; transform: translateY(14px); }
    5%, 20% { opacity: 1; transform: translateY(0); }
    25%, 100% { opacity: 0; transform: translateY(-14px); }
  }
  .blink { animation: blink 1.05s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  ${typeKeyframes.join('\n  ')}`;

  const desc = ['I build products end to end — from type-safe', 'GraphQL APIs and Postgres schemas to polished', 'React Native apps and the cloud they run on.'];

  const body = `
  ${sparkles([
    [610, 58, 1, 0],
    [470, 392, 0.7, 1.2],
    [1168, 404, 0.8, 2.1],
    [36, 404, 0.6, 0.6],
    [1168, 40, 0.55, 1.7],
    [646, 252, 0.5, 2.6],
  ])}

  <!-- intro -->
  ${pill({ x: 72, y: 76, label: 'ISLAMABAD, PAKISTAN', color: C.emerald })}
  <text x="68" y="188" class="sans" font-size="74" font-weight="700" letter-spacing="-1.5" fill="${C.text}">Hammad Khan</text>
  <g>
    ${roleTexts}
  </g>
  ${desc.map((line, i) => `<text x="72" y="${296 + i * 28}" class="sans" font-size="18" fill="${C.muted}">${esc(line)}</text>`).join('\n  ')}

  <!-- terminal -->
  <rect x="${tx + 10}" y="${ty + 26}" width="${tw - 20}" height="${th}" rx="16" fill="#000000" opacity=".55" filter="url(#shadow)"/>
  <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="16" fill="${C.term}"/>
  <rect x="${tx + 0.5}" y="${ty + 0.5}" width="${tw - 1}" height="${th - 1}" rx="15.5" stroke="url(#brandDiag)" stroke-opacity=".45"/>
  <path d="M${tx} ${ty + 42}H${tx + tw}" stroke="#FFFFFF" stroke-opacity=".07"/>
  <circle cx="${tx + 22}" cy="${ty + 21}" r="6" fill="#FF5F57"/>
  <circle cx="${tx + 42}" cy="${ty + 21}" r="6" fill="#FEBC2E"/>
  <circle cx="${tx + 62}" cy="${ty + 21}" r="6" fill="#28C840"/>
  <text x="${tx + tw / 2}" y="${ty + 25}" text-anchor="middle" class="mono" font-size="12" fill="${C.dim}">hammad@dev: ~</text>
  <g>
    ${termLines.join('\n    ')}
    ${cursor}
  </g>`;

  return card({
    w,
    h,
    rx: 28,
    title: 'Hammad Khan — Full-Stack Engineer',
    desc: 'Hammad Khan, a full-stack engineer based in Islamabad, Pakistan, building type-safe GraphQL APIs, Postgres schemas, React Native apps and cloud infrastructure.',
    glows: `<circle class="blob" cx="140" cy="30" r="170" fill="${C.emerald}"/>
    <circle class="blob b2" cx="560" cy="480" r="180" fill="${C.cyan}"/>
    <circle class="blob b3" cx="1120" cy="60" r="200" fill="${C.violet}"/>`,
    defs: `<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>`,
    style,
    reduced: `.role { opacity: 0; } .r0 { opacity: 1; } .cover { display: none; }`,
    body,
  });
}

// ───────────────────────────────────────────────────────────── footer
function footer() {
  const w = 1200;
  const h = 220;
  const body = `
  ${sparkles([
    [300, 70, 0.8, 0.3],
    [905, 150, 0.7, 1.4],
    [180, 160, 0.5, 2.2],
    [1030, 64, 0.55, 0.9],
  ])}
  <text x="600" y="102" text-anchor="middle" class="sans" font-size="36" font-weight="700" letter-spacing="-.5" fill="${C.text}">Thanks for stopping by</text>
  <text x="600" y="140" text-anchor="middle" class="sans" font-size="18" fill="${C.muted}">Always happy to talk NestJS, GraphQL, React Native and the cloud.</text>
  <rect class="bar" x="500" y="170" width="200" height="3" rx="1.5" fill="url(#brand)"/>`;

  return card({
    w,
    h,
    rx: 28,
    title: 'Thanks for stopping by',
    desc: 'Thanks for visiting the profile of Hammad Khan.',
    glows: `<circle cx="140" cy="230" r="170" fill="${C.emerald}"/>
    <circle cx="1080" cy="-10" r="180" fill="${C.violet}"/>`,
    glowOpacity: 0.3,
    style: `
  .bar { transform-box: fill-box; transform-origin: center; animation: breathe 3.2s ease-in-out infinite alternate; }
  @keyframes breathe { from { transform: scaleX(.35); opacity: .6; } to { transform: scaleX(1); opacity: 1; } }`,
    body,
  });
}

const files = {
  'assets/header.svg': header(),
  'assets/footer.svg': footer(),
};
for (const [path, svg] of Object.entries(files)) {
  writeFileSync(join(OUT, path), svg);
  console.log(`wrote ${path} (${(svg.length / 1024).toFixed(1)} KB)`);
}
