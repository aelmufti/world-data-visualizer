// Quick manual test for the historical data endpoint
// Run with: node server/test-historical-endpoint.js

const BASE_URL = 'http://localhost:8000';

async function testHistoricalEndpoint() {
  console.log('Testing Historical Data Endpoint...\n');

  // Test 1: Valid request
  console.log('Test 1: Valid request (AAPL, 1d, 5d)');
  try {
    const response = await fetch(
      `${BASE_URL}/api/stock/history/AAPL?interval=1d&range=5d`
    );
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ Success!');
      console.log(`  Symbol: ${data.symbol}`);
      console.log(`  Data points: ${data.data.length}`);
      console.log(`  Currency: ${data.meta.currency}`);
      console.log(`  Exchange: ${data.meta.exchangeName}`);
      if (data.data.length > 0) {
        console.log(`  First candle:`, data.data[0]);
      }
    } else {
      console.log('✗ Failed:', data);
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Missing interval
  console.log('Test 2: Missing interval parameter');
  try {
    const response = await fetch(
      `${BASE_URL}/api/stock/history/AAPL?range=5d`
    );
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✓ Correctly returned 400 error');
      console.log(`  Error: ${data.error}`);
    } else {
      console.log('✗ Expected 400 error, got:', response.status);
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Invalid interval
  console.log('Test 3: Invalid interval');
  try {
    const response = await fetch(
      `${BASE_URL}/api/stock/history/AAPL?interval=invalid&range=5d`
    );
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✓ Correctly returned 400 error');
      console.log(`  Error: ${data.error}`);
      console.log(`  Valid intervals: ${data.validIntervals.join(', ')}`);
    } else {
      console.log('✗ Expected 400 error, got:', response.status);
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Cache stats
  console.log('Test 4: Cache statistics');
  try {
    const response = await fetch(
      `${BASE_URL}/api/stock/history/cache/stats`
    );
    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ Success!');
      console.log(`  Cache size: ${data.size}`);
    } else {
      console.log('✗ Failed:', data);
    }
  } catch (error) {
    console.log('✗ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 5: Different intervals
  console.log('Test 5: Testing different intervals');
  const intervals = ['1m', '5m', '15m', '1h', '1d'];
  for (const interval of intervals) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/stock/history/GOOGL?interval=${interval}&range=1d`
      );
      const data = await response.json();
      
      if (response.ok) {
        console.log(`  ✓ ${interval}: ${data.data.length} data points`);
      } else {
        console.log(`  ✗ ${interval}: Failed`);
      }
    } catch (error) {
      console.log(`  ✗ ${interval}: Error - ${error.message}`);
    }
  }

  console.log('\n✅ All tests completed!');
}

// Run tests
testHistoricalEndpoint().catch(console.error);
