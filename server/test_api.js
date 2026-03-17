const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const token = jwt.sign(
  { id: '12345', role: 'SUPER_ADMIN', email: 'test@example.com' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testApi() {
  try {
    const res = await axios.get('http://localhost:5000/api/classes/fake-uuid/schedules', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('ERROR STATUS:', err.response.status);
      console.log('ERROR DATA:', err.response.data);
    } else {
      console.log('ERROR MSG:', err.message);
      console.log('ERROR STACK:', err.stack);
    }
  }
}

testApi();
