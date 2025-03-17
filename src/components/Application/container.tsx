import { FC } from "react";
import "./index.css";
import { ApplicationSelector } from "./selector";

export const ApplicationContainer: FC = () => {
  return (
    <div className="app-container">
      <ApplicationSelector />
      {/* Additional content will go here */}
    </div>
  );
};
