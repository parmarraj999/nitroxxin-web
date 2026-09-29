import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./accessoriesNav.css";

export function AccessoriesNav() {
  const navigate = useNavigate();

  return (
    <nav className="accessories-nav">
      <div className="accessories-nav__left">
        <button
          className="accessories-nav__back-btn"
          aria-label="Go back"
          onClick={() => navigate(-1)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>

        {/* NITROXX Logo linking back to Accessories Home */}
        <Link to="/accessories" className="accessories-nav__logo" aria-label="Nitroxx Home">
          <img
            src="/assets/images/logo-black.png"
            alt="Nitroxx"
            className="accessories-nav__logo-img"
          />
        </Link>
      </div>

      <div className="accessories-nav__right">
        <Link
          to="/profile"
          className="accessories-nav__icon-btn"
          aria-label="Profile"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
          </svg>
        </Link>

        <Link
          to="/cart"
          className="accessories-nav__icon-btn"
          aria-label="Cart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}