# AIS Stream Test Files Usage

## Security Fix Applied

The test files have been updated to use environment variables instead of hardcoded API keys.

## How to Use

### Option 1: Inline Environment Variable

```bash
AIS_API_KEY=your_key_here node test-ais-connection.js
```

or

```bash
AIS_API_KEY=your_key_here node test-ais-connection.mjs
```

### Option 2: Export Environment Variable

```bash
export AIS_API_KEY=your_key_here
node test-ais-connection.js
```

### Option 3: Use .env File

Add to your `.env` file:
```
AIS_API_KEY=your_key_here
```

Then use with dotenv:
```bash
node -r dotenv/config test-ais-connection.js
```

## Getting Your API Key

1. Go to https://aisstream.io
2. Sign up or log in
3. Generate a new API key
4. Use it with the test scripts as shown above

## Important Notes

- Never commit your actual API key to Git
- The test files are now in .gitignore to prevent accidental commits
- Always use environment variables for sensitive data
