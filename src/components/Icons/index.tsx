import { FC } from "react";

export interface CloseProps {
  size?: number;
  color?: string;
  className?: string;
}
export const Close: FC<CloseProps> = (props) => {
  const { size = 12, color = "#000", className } = props;
  return (
    <div className={className}>
      <svg
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        <path
          d="M512 421.504L874.048 59.456a64 64 0 0 1 90.496 90.496L602.496 512l362.048 362.048a64 64 0 0 1-90.496 90.496L512 602.496l-362.048 362.048A64 64 0 1 1 59.52 874.048L421.504 512 59.456 149.952A64 64 0 0 1 149.952 59.52L512 421.504z"
          fill={color}
        ></path>
      </svg>
    </div>
  );
};
