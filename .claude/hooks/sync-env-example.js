#!/usr/bin/env node
// Runs as a PostToolUse hook after Edit/Write tool calls.
// Scans the edited file for SvelteKit env var usages and appends any new ones to .env.example.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let event;
try {
	event = JSON.parse(raw);
} catch {
	process.exit(0);
}

const filePath = event?.tool_input?.file_path;
if (!filePath || !/\.(ts|svelte|js)$/.test(filePath)) process.exit(0);

let content;
try {
	content = readFileSync(filePath, 'utf8');
} catch {
	process.exit(0);
}

const vars = new Set();

// import { VAR1, VAR2 } from '$env/static/public' (and dynamic/private variants)
const importRe =
	/import\s*\{([^}]+)\}\s*from\s*['"`]\$env\/(?:static|dynamic)\/(?:public|private)['"`]/g;
let m;
while ((m = importRe.exec(content)) !== null) {
	m[1]
		.split(',')
		.map(v => v.trim().split(/\s+as\s+/)[0].trim()) // handle `FOO as foo`
		.filter(v => /^[A-Z_][A-Z0-9_]*$/.test(v))
		.forEach(v => vars.add(v));
}

// env.VAR_NAME style (used in site.ts via SvelteKit's env object)
const envPropRe = /\benv\.([A-Z][A-Z0-9_]+)/g;
while ((m = envPropRe.exec(content)) !== null) vars.add(m[1]);

if (vars.size === 0) process.exit(0);

const envExamplePath = join(process.cwd(), '.env.example');
const existing = existsSync(envExamplePath) ? readFileSync(envExamplePath, 'utf8') : '';

const lines = existing.trimEnd().split('\n');
const newVars = [];

for (const varName of [...vars].sort()) {
	if (existing.includes(varName + '=')) continue;

	const label = varName.replace(/^PUBLIC_/, '').toLowerCase().replace(/_/g, ' ');
	lines.push('', `# ${label}`, `${varName}=`);
	newVars.push(varName);
}

if (newVars.length > 0) {
	writeFileSync(envExamplePath, lines.join('\n') + '\n');
	process.stderr.write(`[sync-env-example] Added to .env.example: ${newVars.join(', ')}\n`);
}

process.exit(0);
