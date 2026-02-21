export async function register() {
  // Only run on the Node.js server runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startGatewayBridge } = await import('./lib/openclaw/gateway-bridge');
    startGatewayBridge();
  }
}
