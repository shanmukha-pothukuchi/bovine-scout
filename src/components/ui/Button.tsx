import { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  className,
  variant = "solid",
  ...props
}: {
  children: ReactNode;
  disabled?: boolean;
  variant?: "solid" | "outline";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${
        variant === "solid" && "bg-black text-white hover:bg-gray-800"
      } ${
        variant === "outline" &&
        "ring-1 ring-gray-400 text-black bg-white hover:bg-gray-300"
      } text-sm px-3 py-2 rounded-md transition duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
