import { memo, useState } from "react";
import { FaFacebookF, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import AuthFormWrapper from "./AuthFormWrapper";

const LoginModal = ({ onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case "email": {
        if (!value.trim()) return "Email is required";
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(value) ? "" : "Please enter a valid email address";
      }
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    if (type !== "checkbox") {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = {
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some(Boolean)) {
      // Replace with the app's auth API call when it is available.
      console.log("Login successful:", formData);
    }
  };

  return (
    <AuthFormWrapper labelledBy="auth-login-title">
      <p className="auth-brand">voyger</p>
      <h2 id="auth-login-title" className="auth-heading">
        Welcome Back
      </h2>
      <p className="auth-subheading">Log in to continue your journey</p>

      <div className="auth-social-buttons" role="group" aria-label="Social login">
        <button type="button" className="auth-social-btn" aria-label="Continue with Google">
          <FaGoogle className="auth-google-icon" />
        </button>
        <button type="button" className="auth-social-btn" aria-label="Continue with Facebook">
          <FaFacebookF className="auth-facebook-icon" />
        </button>
      </div>

      <div className="auth-divider" role="separator">
        <span>or</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Login form">
        <div className="auth-form-group">
          <label htmlFor="login-email" className="auth-sr-only">
            Email Address
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "auth-input-error" : ""}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            autoComplete="email"
          />
          {errors.email && (
            <span id="login-email-error" className="auth-error-message" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className="auth-form-group">
          <label htmlFor="login-password" className="auth-sr-only">
            Password
          </label>
          <div className={`auth-password-wrapper ${errors.password ? "auth-input-error" : ""}`}>
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-toggle-password"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <span id="login-password-error" className="auth-error-message" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <div className="auth-form-options">
          <label className="auth-remember-me">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <span>Remember me</span>
          </label>
          <button type="button" className="auth-link-button">
            Forgot Password?
          </button>
        </div>

        <button type="submit" className="auth-submit-btn">
          Log In
        </button>
      </form>

      <p className="auth-switch-text">
        Don't have an account?
        <button type="button" onClick={onSwitchToSignup}>
          Sign Up
        </button>
      </p>
    </AuthFormWrapper>
  );
};

export default memo(LoginModal);
