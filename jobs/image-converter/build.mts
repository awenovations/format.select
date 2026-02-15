import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['index.ts'],
	outfile: 'dist/index.js',
	platform: 'node',
	target: 'node22',
	format: 'esm',
	bundle: true,
	sourcemap: true,
	packages: 'external'
});

console.log('Build complete');
