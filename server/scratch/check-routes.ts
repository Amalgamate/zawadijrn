import app from '../src/server';

function printRoutes(stack: any, prefix = '') {
  stack.forEach((layer: any) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      const path = prefix + layer.route.path;
      if (path.includes('waiver') || path.includes('fee')) {
        console.log(`[ROUTE] ${methods.padEnd(7)} ${path}`);
      }
    } else if (layer.name === 'router' && layer.handle?.stack) {
      // It's a router (mounted middleware)
      const newPrefix = prefix + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\', '').replace(/\\\//g, '/').replace('\\/?$', ''));
      printRoutes(layer.handle.stack, newPrefix);
    }
  });
}

console.log('--- REGISTERED API ROUTES ---');
// Routes are mounted at /api in server.ts
// app._router.stack contains the root middleware
printRoutes(app._router.stack);
console.log('--- END ---');
process.exit(0);
