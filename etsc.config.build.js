module.exports = {
  esbuild: {
    entryPoints: ['./src/main.ts'],
    minify: true,
    target: "es6",
    bundle: true,
    sourcemap: true,
  },
}
