import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import API from '../../api/axios';

function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const res = await API.post('/auth/login', credentials);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 401) {
        setError('Invalid email or password. Please check both and try again.');
      } else if (status === 423) {
        setError('Too many incorrect attempts. Please try again in 15 minutes.');
      } else if (status === 429) {
        setError('Too many login requests. Please wait a few minutes and try again.');
      } else if (!requestError.response) {
        setError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setError('Sign in is temporarily unavailable. Please try again shortly.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-darkbg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span className="text-white text-2xl font-bold tracking-wider">Delta.</span>
          <span className="text-gold text-xs tracking-[0.3em] uppercase ml-2">Admin</span>
        </div>

        <div className="border border-gold/20 p-8">
          <h1 className="text-white text-xl font-bold mb-6 tracking-wider">Sign In</h1>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-400/10 px-4 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
              className="bg-white/5 border border-gold/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                aria-label="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
                className="w-full bg-white/5 border border-gold/20 px-4 pr-12 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-white/50 transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gold text-darkbg font-bold py-3 tracking-widest uppercase text-sm hover:bg-gold/90 transition-colors disabled:cursor-wait disabled:opacity-70">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
