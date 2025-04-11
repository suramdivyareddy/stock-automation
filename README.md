# Stock Automation: Alpha Vantage → Google Sheets (Node.js)

This project automates the process of fetching daily stock data using the Alpha Vantage API and appending it to a Google Sheet. It includes smart validation, retry logic, and runs automatically every day at 9 AM EST via GitHub Actions.

## Features

- Fetches stock data for **10 major companies**
- Appends daily data to **Google Sheets**
- Automatically adds headers (if missing)
- Skips duplicate entries
- Includes retry logic for API errors
- Creates a local **CSV backup** (`stock-backup.csv`)
- Validates latest row using a test script
- Fully automated using **GitHub Actions**
- Credentials handled securely via **GitHub Secrets**


## Technologies Used

- **Node.js**
- **Alpha Vantage API**
- **Google Sheets API**
- **GitHub Actions**


## Stock Symbols Tracked

- AAPL
- MSFT
- GOOGL
- AMZN
- META
- TSLA
- NVDA
- NFLX
- INTC
- IBM


## Setup Instructions

### 1. Clone this repo

```bash
git clone https://github.com/yourusername/stock-automation.git
cd stock-automation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```env
SHEET_ID=your_google_sheet_id_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```


## Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable **Google Sheets API**
3. Create a **Service Account** and download `credentials.json`
4. Share your Google Sheet with the service account’s email as **Editor**


## Run Locally

```bash
node index.js     # Fetches and writes stock data
node test.js      # Verifies latest row matches Alpha Vantage API
```


## Scheduled Automation (GitHub Actions)

This project runs daily at **9 AM EST** via GitHub Actions.

### GitHub Secrets required:

- `SHEET_ID`  
- `ALPHA_VANTAGE_API_KEY`  
- `GOOGLE_CREDENTIALS_BASE64` → base64-encoded `credentials.json`

The workflow:
- Generates `.env` on the fly
- Reconstructs `credentials.json` securely
- Runs `index.js`
- Runs `test.js` to validate the update


## Output Example

Sheet:

```
Date       | Symbol | Open   | Close  | High   | Low    | Volume
-----------|--------|--------|--------|--------|--------|--------
2025-04-10 | AAPL   | 172.56 | 175.20 | 176.10 | 171.90 | 43000000
```

CSV backup:

```
stock-backup.csv (auto-generated after each run)
```


## Data Validation

`test.js` fetches current stock data from Alpha Vantage  
and compares it with the latest row in your sheet.


## Project Structure

```
.
├── index.js              ← main automation script
├── test.js               ← data validation script
├── .env                  ← your API keys (excluded from GitHub)
├── credentials.json      ← Google API credentials (not committed)
├── stock-backup.csv      ← auto-generated backup
├── .github/workflows/    ← GitHub Actions automation
├── README.md
```


## Security Note

- `.env` and `credentials.json` are excluded from GitHub
- GitHub Secrets are used for secure deployment


