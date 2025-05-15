import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();
const customLogger = (message: String, ...rest: String[]) =>
  console.log(message, ...rest);

app.use(logger(customLogger));

// Basic HTTP route for testing
app.get("/", (c) => {
  return c.html(`
    <html>
      <body>
        <div>
          <div>
            <span>Socket Status : </span>
            <span id="status-text">Disconnected</span>
          </div>
          <input type="text" id="symbol" placeholder="Enter symbol" />
          <button id="connect-btn">Connect</button>
          <button id="close-btn">Close</button>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Time</th>
              </tr>
              <tr id="data-row"></tr>
            </thead>
          </table>
          <script>
            const statusText = document.getElementById("status-text");
            const connectBtn = document.getElementById("connect-btn");
            const closeBtn = document.getElementById("close-btn");
            const dataRow = document.getElementById("data-row");

            connectBtn.onclick = () => {
              if (statusText.innerHTML === "Disconnected") {
                statusText.innerHTML = "Connecting...";
                const symbol = document.getElementById("symbol").value;
                const binanceWsUrl = "wss://stream.binance.com:9443/ws/" + symbol + "usdt@aggTrade";
                const ws = new WebSocket(binanceWsUrl);
                
                ws.onopen = () => {
                  statusText.innerHTML = "Connected";
                };
                
                ws.onclose = () => {
                  statusText.innerHTML = "Disconnected";
                };
                
                ws.onmessage = (event) => {
                  const data = JSON.parse(event.data);
                  dataRow.innerHTML = \`
                    <td>\${data.s}</td>
                    <td>\${data.p}</td>
                    <td>\${data.q}</td>
                    <td>\${new Date(data.E).toLocaleTimeString()}</td>
                  \`;
                };

                closeBtn.onclick = () => {
                  ws.close();
                };
              }
            };
          </script>
        </div>
      </body>
    </html>
  `);
});

app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

export default app;
