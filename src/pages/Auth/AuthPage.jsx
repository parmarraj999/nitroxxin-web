import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AuthPage.css';

const AuthPage = ({ isSignupView = false }) => {
  const [isSignup, setIsSignup] = useState(isSignupView);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signUp, forgotPassword } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name, value) => {
    if (isSignup && name === 'fullName') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 3) return 'Full name must be at least 3 characters';
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) return 'Email is required';
      if (!emailRegex.test(value)) return 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (isSignup) {
        if (!/[A-Z]/.test(value)) return 'Must contain one uppercase letter';
        if (!/[a-z]/.test(value)) return 'Must contain one lowercase letter';
        if (!/[0-9]/.test(value)) return 'Must contain one number';
      }
    }
    return '';
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    if (type !== 'checkbox') {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };
    if (isSignup) {
      newErrors.fullName = validateField('fullName', formData.fullName);
    }
    setErrors(newErrors);

    if (!Object.values(newErrors).some(Boolean)) {
      try {
        setIsSubmitting(true);
        setSubmitError('');
        if (isSignup) {
          await signUp(formData);
        } else {
          await login(formData);
        }
        // Redirect back or to home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } catch (error) {
        setSubmitError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    const emailError = validateField('email', formData.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }
    try {
      setSubmitError('');
      await forgotPassword(formData.email);
      setSubmitError('Password reset email sent.');
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const toggleView = () => {
    setIsSignup(!isSignup);
    setErrors({});
    setSubmitError('');
    navigate(isSignup ? '/login' : '/signup', { replace: true });
  };

  return (
    <div className="auth-page-container">
      <div className="auth-hero-section">
        <div className="auth-hero-image-wrapper">
          <img src={'https://i.pinimg.com/736x/b5/f7/ce/b5f7ce0a1d973e492c2b1bf6b74a61a7.jpg'} alt="Ping Pong Table" className="auth-hero-image" />
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-wrapper">
          <form className="auth-page-form" onSubmit={handleSubmit} noValidate>

            {isSignup && (
              <div className="auth-input-group">
                <label htmlFor="fullName" className="auth-label">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? 'auth-input input-error' : 'auth-input'}
                />
                {errors.fullName && <span className="auth-error-text">{errors.fullName}</span>}
              </div>
            )}

            <div className="auth-input-group">
              <label htmlFor="email" className="auth-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="wasola@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'auth-input input-error' : 'auth-input'}
              />
              {errors.email && <span className="auth-error-text">{errors.email}</span>}
            </div>

            <div className="auth-input-group">
              <label htmlFor="password" className="auth-label">Password</label>
              <div className={`auth-password-input-wrapper ${errors.password ? 'input-error' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="auth-error-text">{errors.password}</span>}
            </div>

            {!isSignup && (
              <div className="auth-form-extras">
                <label className="auth-remember-me">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-forgot-password-btn" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              </div>
            )}

            {submitError && <div className="auth-submit-error">{submitError}</div>}

            <button type="submit" className="auth-primary-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (isSignup ? 'Signing Up...' : 'Signing In...') : (isSignup ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="auth-page-divider">
            <span>or</span>
          </div>

          <button type="button" className="auth-google-btn">
            <FaGoogle /> Continue with Google
          </button>

          <p className="auth-switch-prompt">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{' '}
            <button type="button" className="auth-switch-view-btn" onClick={toggleView}>
              {isSignup ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
