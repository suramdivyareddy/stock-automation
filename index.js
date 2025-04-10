require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const { google } = require('googleapis');

//Environment variables
const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

//Configuration
const TAB_NAME = 'StockTracker';
const HEADERS = ['Date', 'Symbol', 'Open', 'Close', 'High', 'Low', 'Volume'];
const STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX', 'INTC', 'IBM'];

//Authenticates with Google Sheets API using service account
const authSheets = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth: await auth.getClient() });
};

//Ensures headers are present in the sheet
const setupHeaders = async (sheets) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${TAB_NAME}'!A1:G1`
  });

  const headersMissing = !res.data.values || res.data.values.length === 0;
  if (headersMissing) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${TAB_NAME}'!A1:G1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] }
    });

    console.log('Added column headers');
  }
};


//Fetches the latest available stock data from Alpha Vantage and includes retry logic to handle transient API failures
const fetchStock = async (symbol, retries = 3) => {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;

  while (retries--) {
    try {
      const res = await axios.get(url);
      const data = res.data['Time Series (Daily)'];
      const latest = Object.keys(data)[0];
      const record = data[latest];

      return {
        date: latest,
        symbol,
        open: record['1. open'],
        close: record['4. close'],
        high: record['2. high'],
        low: record['3. low'],
        volume: record['5. volume']
      };
    } catch {
      await new Promise(res => setTimeout(res, 5000)); // Wait before retry
    }
  }

  console.error(`Failed to fetch ${symbol} after retries`);
};

//Checks if the stock data already exists in the sheet
const isDuplicate = async (sheets, row) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${TAB_NAME}'!A2:B`
  });

  const rows = res.data.values || [];
  return rows.some(r => r[0] === row.date && r[1] === row.symbol);
};

//Saves newly added rows as CSV backup
const backupToCSV = (rows) => {
  const content = [
    HEADERS.join(','),
    ...rows.map(r => HEADERS.map(h => r[h.toLowerCase()]).join(','))
  ].join('\n');

  fs.writeFileSync('stock-backup.csv', content);
  console.log('Backup saved to stock-backup.csv');
};

//Main script execution
const main = async () => {
  const sheets = await authSheets();
  await setupHeaders(sheets);
  const newRows = [];

  for (const symbol of STOCKS) {
    const stock = await fetchStock(symbol);
    if (!stock) continue;

    const exists = await isDuplicate(sheets, stock);
    if (exists) {
      console.log(`Skipped ${symbol} on ${stock.date}`);
      continue;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `'${TAB_NAME}'!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          stock.date,
          stock.symbol,
          stock.open,
          stock.close,
          stock.high,
          stock.low,
          stock.volume
        ]]
      }
    });

    newRows.push(stock);
    console.log(`Added: ${symbol} on ${stock.date}`);
  }

  if (newRows.length > 0) backupToCSV(newRows);
};

main().catch(console.error);
