import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl blur-lg opacity-75"></div>
              <div className="relative bg-white rounded-3xl shadow-xl p-6">
                <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
                  404
                </h1>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">
              Page Not Found
            </h2>
            <p className="text-neutral-600 mb-8 text-lg">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <Link
              to="/"
              className="btn-primary py-3 px-8 text-base rounded-lg inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
