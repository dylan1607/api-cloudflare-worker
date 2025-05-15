import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { WebSocket } from 'ws';
import * as readline from 'readline';

const upTime = new Date().toISOString();
// Create an interface for input and output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const askQuestion = (question: string) => {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer);
    });
  });
};
const app = new Hono();
const customLogger = (message: String, ...rest: String[]) =>
  console.log(message, ...rest);

app.use(logger(customLogger));

app.get('/', async (c) => {
  customLogger('response: ', c.req.raw.method, c.req.raw.url);
  return c.text('Hello World!');
});

app.get('/health', async (c) => {
  customLogger('UpTime: ', upTime);
  return c.json({ message: upTime, statusCode: 200 }, 200);
});

// Binance WebSocket setup
let ws: WebSocket;
let isClosing = false;

// Function to initialize WebSocket connection
function startWebSocket(symbol: string) {
  const binanceWsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@aggTrade`;
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

app.notFound((c) => {
  return c.json({ message: 'Not Found', ok: false }, 404);
});

const main = async () => {
  // Get user input using await
  const symbol = await askQuestion('Input crypto name? \n');
  // Start WebSocket connection
  startWebSocket(symbol as string);
  // Close the readline interface
  rl.close();
};

// Call the main async function
main();

export default app;
