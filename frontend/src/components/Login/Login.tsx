import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

interface LoginResponse {
  status: string;
  data: {
    token: string;
    expires_at: string;
    user: {
      id: string;
      username: string;
      first_name: string;
      last_name: string;
      is_admin: boolean;
    };
  };
}

interface RegisterData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [registerData, setRegisterData] = useState<RegisterData>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Use fetch directly instead of authService
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
        const loginResponse = data as LoginResponse;
        
        if (loginResponse.status === 'success' && loginResponse.data.token) {
          // Store the token and user data in localStorage
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
          localStorage.setItem('token_expiry', loginResponse.data.expires_at);
          
          // Navigate to dashboard
          navigate('/dashboard');
        }
      } else {
        // Handle error response
        setError(data.error || 'Failed to login. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (registerData.password !== registerData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Use fetch directly instead of authService
      const response = await fetch('http://localhost:4000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          organization_id: 1 // Default organization ID
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Show success message temporarily
        setError('');
        
        // Registration successful, switch to login form
        setIsLogin(true);
        setEmail(registerData.email);
        setPassword('');
        
        // Clear the registration form
        setRegisterData({
          first_name: '',
          last_name: '',
          username: '',
          email: '',
          password: '',
          confirm_password: ''
        });
      } else {
        // Handle error response
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>People X</h1>
        <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        {error && <div className="error-message">{error}</div>}
        
        {isLogin ? (
          // Login Form
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="login-button">
              Log In
            </button>
          </form>
        ) : (
          // Registration Form
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={registerData.first_name}
                onChange={handleRegisterChange}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={registerData.last_name}
                onChange={handleRegisterChange}
                placeholder="Enter your last name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                placeholder="Choose a username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg_email">Email</label>
              <input
                type="email"
                id="reg_email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg_password">Password</label>
              <input
                type="password"
                id="reg_password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Create a password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={registerData.confirm_password}
                onChange={handleRegisterChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            <button type="submit" className="login-button">
              Register
            </button>
          </form>
        )}
        
        <div className="login-footer">
          {isLogin ? (
            <>
              <a href="#forgot-password">Forgot Password?</a>
              <p>
                Don't have an account?{' '}
                <button type="button" className="toggle-form-button" onClick={toggleForm}>
                  Register
                </button>
              </p>
            </>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" className="toggle-form-button" onClick={toggleForm}>
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 