require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');

const SHEET_ID = process.env.SHEET_ID;
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const TAB_NAME = 'Stock Tracker';
const SYMBOL = 'AAPL'; // Can be changed to test others like 'MSFT'

//Authenticates Google Sheets API (read-only)
const authorize = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth: await auth.getClient() });
};

//Fetches latest daily data from Alpha Vantage
const fetchStock = async (symbol) => {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  const data = res.data['Time Series (Daily)'];
  const date = Object.keys(data)[0];
  const record = data[date];

  return {
    date,
    symbol,
    open: record['1. open'],
    close: record['4. close'],
    high: record['2. high'],
    low: record['3. low'],
    volume: record['5. volume']
  };
};

//Fetches the latest row for a stock from Google Sheets
const getLastRow = async (sheets, symbol) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${TAB_NAME}'!A2:G`
  });

  const rows = res.data.values || [];
  const filtered = rows.filter(r => r[1] === symbol);
  return filtered[filtered.length - 1]; // Latest for that symbol
};

//Compares fetched API data with sheet data
const compare = (api, row) => {
  const [date, symbol, open, close, high, low, volume] = row;
  return (
    date === api.date &&
    symbol === api.symbol &&
    parseFloat(open).toFixed(2) === parseFloat(api.open).toFixed(2) &&
    parseFloat(close).toFixed(2) === parseFloat(api.close).toFixed(2) &&
    parseFloat(high).toFixed(2) === parseFloat(api.high).toFixed(2) &&
    parseFloat(low).toFixed(2) === parseFloat(api.low).toFixed(2) &&
    parseInt(volume) === parseInt(api.volume)
  );
};

//Test runner
const main = async () => {
  const sheets = await authorize();
  const apiData = await fetchStock(SYMBOL);
  const sheetRow = await getLastRow(sheets, SYMBOL);

  if (!apiData || !sheetRow) {
    console.log('Not enough data to validate.');
    return;
  }

  const isValid = compare(apiData, sheetRow);
  console.log(isValid
    ? `Sheet matches API data for ${SYMBOL} on ${apiData.date}`
    : `Mismatch: Sheet row does not match API data for ${SYMBOL} on ${apiData.date}`);
};

main().catch(console.error);
