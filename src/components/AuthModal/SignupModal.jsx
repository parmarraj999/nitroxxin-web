import { memo, useState } from "react";
import { FaFacebookF, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import AuthFormWrapper from "./AuthFormWrapper";

const SignupModal = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name, value) => {
    if (name === "fullName") {
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 3) return "Full name must be at least 3 characters";
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) return "Email is required";
      if (!emailRegex.test(value)) return "Enter a valid email address";
    }

    if (name === "password") {
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Z]/.test(value)) return "Must contain one uppercase letter";
      if (!/[a-z]/.test(value)) return "Must contain one lowercase letter";
      if (!/[0-9]/.test(value)) return "Must contain one number";
    }

    return "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newErrors = {
      fullName: validateField("fullName", formData.fullName),
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some(Boolean)) {
      // Replace with the app's auth API call when it is available.
      console.log("Signup successful:", formData);
    }
  };

  return (
    <AuthFormWrapper labelledBy="auth-signup-title">
      <p className="auth-brand">voyger</p>
      <h2 id="auth-signup-title" className="auth-heading">
        Start your
        <br />
        perfect trip
      </h2>

      <div className="auth-social-buttons" role="group" aria-label="Social signup">
        <button type="button" className="auth-social-btn" aria-label="Sign up with Google">
          <FaGoogle className="auth-google-icon" />
        </button>
        <button type="button" className="auth-social-btn" aria-label="Sign up with Facebook">
          <FaFacebookF className="auth-facebook-icon" />
        </button>
      </div>

      <div className="auth-divider" role="separator">
        <span>or</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Signup form">
        <div className="auth-form-group">
          <label htmlFor="signup-full-name" className="auth-sr-only">
            Full name
          </label>
          <input
            type="text"
            id="signup-full-name"
            name="fullName"
            placeholder="Full name"
            value={formData.fullName}
            onChange={handleChange}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "signup-full-name-error" : undefined}
            className={errors.fullName ? "auth-input-error" : ""}
            autoComplete="name"
          />
          {errors.fullName && (
            <span id="signup-full-name-error" className="auth-error-message" role="alert">
              {errors.fullName}
            </span>
          )}
        </div>

        <div className="auth-form-group">
          <label htmlFor="signup-email" className="auth-sr-only">
            Email Address
          </label>
          <input
            type="email"
            id="signup-email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            className={errors.email ? "auth-input-error" : ""}
            autoComplete="email"
          />
          {errors.email && (
            <span id="signup-email-error" className="auth-error-message" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className="auth-form-group">
          <label htmlFor="signup-password" className="auth-sr-only">
            Password
          </label>
          <div className={`auth-password-wrapper ${errors.password ? "auth-input-error" : ""}`}>
            <input
              type={showPassword ? "text" : "password"}
              id="signup-password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "signup-password-error" : undefined}
              autoComplete="new-password"
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
            <span id="signup-password-error" className="auth-error-message" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <button type="submit" className="auth-submit-btn">
          Start
        </button>
      </form>

      <p className="auth-switch-text">
        Already have an account?
        <button type="button" onClick={onSwitchToLogin}>
          Log In
        </button>
      </p>
    </AuthFormWrapper>
  );
};

export default memo(SignupModal);
