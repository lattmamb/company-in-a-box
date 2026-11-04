import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing = "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

export const transitions = {
  fast: "transition-all duration-150 ease-out",
  normal: "transition-all duration-200 ease-out",
  slow: "transition-all duration-300 ease-out",
};

export const shadows = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  inner: "shadow-inner",
};

export const radii = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
};

export const fontSizes = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

export const fontWeights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const colors = {
  primary: {
    50: "text-primary-50",
    100: "text-primary-100",
    500: "text-primary-500",
    600: "text-primary-600",
    700: "text-primary-700",
    900: "text-primary-900",
  },
  gray: {
    50: "text-gray-50",
    100: "text-gray-100",
    500: "text-gray-500",
    600: "text-gray-600",
    900: "text-gray-900",
  },
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
  info: "text-blue-600",
};

export const bgColors = {
  primary: {
    50: "bg-primary-50",
    100: "bg-primary-100",
    500: "bg-primary-500",
    600: "bg-primary-600",
    700: "bg-primary-700",
  },
  gray: {
    50: "bg-gray-50",
    100: "bg-gray-100",
    500: "bg-gray-500",
    900: "bg-gray-900",
  },
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export const borders = {
  default: "border-gray-200",
  primary: "border-primary-500",
  error: "border-red-500",
  success: "border-green-500",
  warning: "border-yellow-500",
};

export const layout = {
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  section: "py-12 lg:py-16",
  card: "bg-white rounded-lg shadow-sm border border-gray-200",
  cardHover: "hover:shadow-md transition-shadow duration-200",
};