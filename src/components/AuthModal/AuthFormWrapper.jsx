import { memo } from "react";

const AuthFormWrapper = ({ children, labelledBy }) => (
  <section className="auth-form-panel" aria-labelledby={labelledBy}>
    {children}
  </section>
);

export default memo(AuthFormWrapper);
