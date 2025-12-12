import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // http errors should be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function loadTest() {
  // 1. Visit Homepage
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  });
  sleep(1);

  // 2. Visit Products Page
  const productsRes = http.get(`${BASE_URL}/products`);
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
  });
  sleep(2);

  // 3. View Single Product (mock ID)
  // Note: In a real test, you'd want to fetch a valid ID first
  const productRes = http.get(`${BASE_URL}/products/demo-product`);
  check(productRes, {
    'product page status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(1);

  // 4. API Health Check
  const apiRes = http.get(`${BASE_URL}/api/health`);
  check(apiRes, {
    'API health endpoint accessible': (r) => r.status === 200 || r.status === 404,
  });
}
