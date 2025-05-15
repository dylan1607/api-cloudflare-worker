import { WebSocket } from 'ws';

function startWebSocket(symbol: string = 'init') {
  // Binance WebSocket setup
  let ws: WebSocket;
  let isClosing = false;
  const binanceWsUrl = `wss://stream.binance.com:9443/ws/${symbol}usdt@aggTrade`;
  if (isClosing) return;

  ws = new WebSocket(binanceWsUrl);

  ws.on('open', () => {
    console.log('Connected to Binance WebSocket');
  });

  ws.on('message', (data) => {
    try {
      const trade = JSON.parse(data.toString()); // Parse Buffer to JSON
      // {
      //   "e": "aggTrade",    // Event type
      //   "E": 1672515782136, // Event time
      //   "s": "BNBBTC",      // Symbol
      //   "a": 12345,         // Aggregate trade ID
      //   "p": "0.001",       // Price
      //   "q": "100",         // Quantity
      //   "f": 100,           // First trade ID
      //   "l": 105,           // Last trade ID
      //   "T": 1672515782136, // Trade time
      //   "m": true,          // Is the buyer the market maker?
      //   "M": true           // Ignore
      // }
      console.clear();
      console.table({
        symbol: trade.s,
        price: trade.p,
        quantity: trade.q,
        tradeTime: new Date(trade.T).toISOString(),
      });
      return trade;
    } catch (error) {
      console.error(
        'Error parsing WebSocket message:',
        (error as Error).message
      );
    }
  });

  ws.on('ping', (data) => {
    // Binance sends ping frames; respond with pong
    ws.pong(data);
    console.log('Received ping, sent pong');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket closed: ${code} - ${reason}`);
    if (!isClosing) {
      // Reconnect after 5 seconds unless shutting down
      console.log('Reconnecting in 5 seconds...');
      setTimeout(() => startWebSocket(symbol), 5000);
    }
  });
}

export default startWebSocket;
