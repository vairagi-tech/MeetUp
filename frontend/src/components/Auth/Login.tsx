import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by auth context
    }
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8\">\n      <div className=\"max-w-md w-full space-y-8\">\n        <div>\n          <div className=\"mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100\">\n            <svg\n              className=\"h-8 w-8 text-blue-600\"\n              fill=\"none\"\n              viewBox=\"0 0 24 24\"\n              stroke=\"currentColor\"\n            >\n              <path\n                strokeLinecap=\"round\"\n                strokeLinejoin=\"round\"\n                strokeWidth={2}\n                d=\"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4\"\n              />\n            </svg>\n          </div>\n          <h2 className=\"mt-6 text-center text-3xl font-extrabold text-gray-900\">\n            Sign in to Student Scheduler\n          </h2>\n          <p className=\"mt-2 text-center text-sm text-gray-600\">\n            Connect with classmates and find perfect meeting times\n          </p>\n        </div>\n\n        <form className=\"mt-8 space-y-6\" onSubmit={handleSubmit(onSubmit)}>\n          {error && (\n            <div className=\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative\">\n              <span className=\"block sm:inline\">{error}</span>\n            </div>\n          )}\n\n          <div className=\"rounded-md shadow-sm -space-y-px\">\n            <div>\n              <label htmlFor=\"email\" className=\"sr-only\">\n                Email address\n              </label>\n              <input\n                {...register('email')}\n                id=\"email\"\n                type=\"email\"\n                autoComplete=\"email\"\n                className=\"appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm\"\n                placeholder=\"Email address\"\n              />\n              {errors.email && (\n                <p className=\"mt-1 text-sm text-red-600\">{errors.email.message}</p>\n              )}\n            </div>\n            <div className=\"relative\">\n              <label htmlFor=\"password\" className=\"sr-only\">\n                Password\n              </label>\n              <input\n                {...register('password')}\n                id=\"password\"\n                type={showPassword ? 'text' : 'password'}\n                autoComplete=\"current-password\"\n                className=\"appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm\"\n                placeholder=\"Password\"\n              />\n              <button\n                type=\"button\"\n                className=\"absolute inset-y-0 right-0 pr-3 flex items-center\"\n                onClick={() => setShowPassword(!showPassword)}\n              >\n                {showPassword ? (\n                  <EyeSlashIcon className=\"h-5 w-5 text-gray-400\" />\n                ) : (\n                  <EyeIcon className=\"h-5 w-5 text-gray-400\" />\n                )}\n              </button>\n              {errors.password && (\n                <p className=\"mt-1 text-sm text-red-600\">{errors.password.message}</p>\n              )}\n            </div>\n          </div>\n\n          <div className=\"flex items-center justify-between\">\n            <Link\n              to=\"/forgot-password\"\n              className=\"text-sm text-blue-600 hover:text-blue-500\"\n            >\n              Forgot your password?\n            </Link>\n          </div>\n\n          <div>\n            <button\n              type=\"submit\"\n              disabled={isLoading}\n              className=\"group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed\"\n            >\n              {isLoading ? (\n                <svg\n                  className=\"animate-spin -ml-1 mr-3 h-5 w-5 text-white\"\n                  xmlns=\"http://www.w3.org/2000/svg\"\n                  fill=\"none\"\n                  viewBox=\"0 0 24 24\"\n                >\n                  <circle\n                    className=\"opacity-25\"\n                    cx=\"12\"\n                    cy=\"12\"\n                    r=\"10\"\n                    stroke=\"currentColor\"\n                    strokeWidth=\"4\"\n                  ></circle>\n                  <path\n                    className=\"opacity-75\"\n                    fill=\"currentColor\"\n                    d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"\n                  ></path>\n                </svg>\n              ) : null}\n              Sign in\n            </button>\n          </div>\n\n          <div className=\"text-center\">\n            <span className=\"text-sm text-gray-600\">\n              Don't have an account?{' '}\n              <Link\n                to=\"/register\"\n                className=\"font-medium text-blue-600 hover:text-blue-500\"\n              >\n                Sign up\n              </Link>\n            </span>\n          </div>\n        </form>\n      </div>\n    </div>\n  );\n};\n\nexport default Login;
