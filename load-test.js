const autocannon = require('autocannon');

async function runLoadTest() {
  console.log('Running load tests against Lib-le-Lib API...');

  const token = 'MOCK_TOKEN';

  const runTest = (name, opts, budget) => {
    return new Promise((resolve) => {
      const instance = autocannon(opts, (err, result) => {
        if (err) {
          console.error(`Error running ${name}:`, err);
          return resolve();
        }

        console.log(`\n--- Load Test Results: ${name} ---`);
        console.log(`Requests/sec: ${result.requests.average}`);
        console.log(`Latency p95: ${result.latency.p95} ms`);
        
        if (result.latency.p95 > budget) {
          console.warn(`WARNING: p95 latency exceeded the ${budget}ms budget!`);
        } else {
          console.log(`SUCCESS: p95 latency is within the ${budget}ms budget.`);
        }
        resolve();
      });

      autocannon.track(instance, { renderProgressBar: true });
    });
  };

  await runTest('Discovery Feed', {
    url: 'http://localhost:3000/discovery',
    connections: 10,
    duration: 10,
    headers: { Authorization: `Bearer ${token}` }
  }, 500);

  await runTest('Swipes', {
    url: 'http://localhost:3000/matches/swipes',
    method: 'POST',
    connections: 10,
    duration: 10,
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetId: 'mock-uuid', action: 'like' })
  }, 200);
}

runLoadTest();
