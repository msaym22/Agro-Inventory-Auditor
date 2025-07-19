// src/components/common/Button.js
import React from 'react';
// No need to import config here if colors are directly defined in tailwind.config.js
// import config from '../../config/config';
// const { THEME_COLORS } = config; // Remove this

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    // Use standard Tailwind classes after extending theme.colors
    primary: `bg-primary text-white hover:bg-success focus:ring-primary`,
    secondary: `bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400`,
    danger: `bg-danger text-white hover:bg-red-700 focus:ring-danger`,
    success: `bg-success text-white hover:bg-primary focus:ring-success`,
    info: `bg-info text-white hover:bg-cyan-600 focus:ring-info`,
    outline: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-secondary`
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed';

  const classes = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${disabled ? disabledStyles : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
export { Button };