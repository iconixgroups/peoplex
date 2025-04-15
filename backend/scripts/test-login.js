// Script to test login functionality
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Attempting to login with test user...');
    const response = await axios.post('http://localhost:4000/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'Test@123'
    });
    
    console.log('Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login failed!');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error message:', error.message);
  }
}

testLogin(); 