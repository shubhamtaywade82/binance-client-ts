import { BinanceClient, createPaperContext, paperTools } from '../src/index.js';

async function main(): Promise<void> {
  const client = new BinanceClient({ testnet: true });
  const ctx = createPaperContext(client, { balance: 50000 });
  const tools = paperTools(ctx);

  const init = tools.find((t) => t.name === 'paper_init')!;
  await init.handler({ balance: 50000 }, { env: 'testnet', isSigned: false });

  const open = tools.find((t) => t.name === 'paper_open_position')!;
  const opened = await open.handler({ symbol: 'SOLUSDT', side: 'LONG', quantity: 100 }, { env: 'testnet', isSigned: false });
  console.log('Opened position:', opened);

  const positions = tools.find((t) => t.name === 'paper_positions')!;
  console.log('Positions (marked-to-market):', await positions.handler({}, { env: 'testnet', isSigned: false }));

  const close = tools.find((t) => t.name === 'paper_close_position')!;
  console.log('Close event:', await close.handler({ symbol: 'SOLUSDT' }, { env: 'testnet', isSigned: false }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
