import React, { useState } from 'react';

function LoginTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Test@123');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setResult('');
    setError('');
    
    try {
      console.log('Attempting to login with:', { email, password });
      const response = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('Server response:', data);
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
        
        // If successful, store login details
        if (data.status === 'success' && data.data?.token) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          localStorage.setItem('token_expiry', data.data.expires_at);
        }
      } else {
        setError(`Error ${response.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(`Network error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <h2>Test Login</h2>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </label>
        </div>
        
        <button 
          type="submit"
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#4285f4', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          Log In
        </button>
      </form>
      
      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px' }}>
          <strong>Success:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

export default LoginTest; 