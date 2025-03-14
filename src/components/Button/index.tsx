import { FC, ReactNode, ComponentPropsWithoutRef } from "react";
import css from "./index.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants = {
  primary: css.primary,
  secondary: css.secondary,
  ghost: css.ghost,
  danger: css.danger,
};

const sizes = {
  sm: css.sm,
  md: css.md,
  lg: css.lg,
};

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const buttonClasses = [
    css.button,
    variants[variant],
    sizes[size],
    className,
  ].join(" ");

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className={css.spinner} />}
      {!isLoading && icon && <span className={css.icon}>{icon}</span>}
      {children}
    </button>
  );
};
