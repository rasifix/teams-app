import fs from 'node:fs';
import path from 'node:path';

const sourceRoot = path.resolve('src');
const cssFiles = [];
const componentFiles = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (file.endsWith('.css')) cssFiles.push(file);
    else if (file.endsWith('.tsx')) componentFiles.push(file);
  }
}

collect(sourceRoot);

const declarations = new Map();

for (const file of cssFiles) {
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  for (const match of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    const selector = match[1].trim();
    const body = match[2]
      .split(';')
      .map(declaration => declaration.trim())
      .filter(Boolean)
      .sort()
      .join(';');

    if (selector.startsWith('@') || body.split(';').length < 2) continue;

    const occurrences = declarations.get(body) ?? [];
    occurrences.push(`${path.relative(process.cwd(), file)} (${selector})`);
    declarations.set(body, occurrences);
  }
}

const duplicateGroups = [...declarations.values()].filter(occurrences => occurrences.length > 1);
let literalClassNames = 0;
let classTokens = 0;
let longClassNames = 0;
const nativeButtonRecipeViolations = [];
const nativeButtonBypasses = [];
const rawVisualTokenViolations = [];

for (const file of componentFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const rawPalettePattern = /(?:text|bg|border|ring|shadow)-(?:slate|gray|orange|red|green|emerald|blue|sky|yellow|amber|violet|white|black)(?:-[^\s"'`}]+|\/[0-9]+)?/g;
  const arbitraryVisualPattern = /(?:text|bg|border|ring|shadow|rounded|tracking|leading)-\[[^\]]+\]/g;
  if (rawPalettePattern.test(source) || arbitraryVisualPattern.test(source)) {
    rawVisualTokenViolations.push(path.relative(process.cwd(), file));
  }
  for (const match of source.matchAll(/className\s*=\s*["']([^"']*)["']/g)) {
    const tokens = match[1].trim().split(/\s+/).filter(Boolean);
    literalClassNames += 1;
    classTokens += tokens.length;
    if (tokens.length > 6) longClassNames += 1;
  }

  if (!file.includes(`${path.sep}components${path.sep}ui${path.sep}`)) {
    for (const match of source.matchAll(/<button\b[\s\S]*?>/g)) {
      if (!/data-ui-control\s*=\s*["'](?:composite|menu-item)["']/.test(match[0])) {
        nativeButtonBypasses.push(path.relative(process.cwd(), file));
      }
      if (/className\s*=\s*(?:["'][^"']*(?:btn-|icon-button|danger-link|ui-switch)|\{`[^`]*(?:btn-|icon-button|danger-link|ui-switch))/.test(match[0])) {
        nativeButtonRecipeViolations.push(path.relative(process.cwd(), file));
      }
    }
  }
}

const limits = {
  // Ratchet these down as remaining feature screens move to semantic recipes.
  classTokens: 2222,
  longClassNames: 54,
};

if (duplicateGroups.length > 0) {
  console.error('Duplicate CSS declaration groups found:');
  for (const group of duplicateGroups) console.error(`\n- ${group.join('\n  ')}`);
}

if (classTokens > limits.classTokens || longClassNames > limits.longClassNames) {
  console.error(
    `Style debt increased (tokens ${classTokens}/${limits.classTokens}, long class names ${longClassNames}/${limits.longClassNames}).`,
  );
}

if (nativeButtonRecipeViolations.length > 0) {
  console.error(`Native buttons use shared action recipes instead of UI components:\n- ${[...new Set(nativeButtonRecipeViolations)].join('\n- ')}`);
}

if (nativeButtonBypasses.length > 0) {
  console.error(`Native buttons bypass the UI component layer without an explicit composite-control marker:\n- ${[...new Set(nativeButtonBypasses)].join('\n- ')}`);
}

if (rawVisualTokenViolations.length > 0) {
  console.error(`Raw palette or arbitrary visual utilities bypass semantic design tokens:\n- ${[...new Set(rawVisualTokenViolations)].join('\n- ')}`);
}

if (duplicateGroups.length > 0 || classTokens > limits.classTokens || longClassNames > limits.longClassNames || nativeButtonRecipeViolations.length > 0 || nativeButtonBypasses.length > 0 || rawVisualTokenViolations.length > 0) {
  process.exit(1);
}

console.log(
  `Styles OK: ${cssFiles.length} CSS files, 0 duplicate rule groups, ${classTokens} class tokens, ${longClassNames} long class names, ${literalClassNames} literal class names.`,
);
