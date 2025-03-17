import React, { FC } from "react";
import "./index.css";
import { ApplicationSelector } from "./selector";
import { useAppService } from "../../services/appService/useAppService";

export const ApplicationContainer: FC = () => {
  const { opened, appService } = useAppService();
  return (
    <div className="app-container">
      <ApplicationSelector />

      <div className="app-content-container">
        {opened.map((item) => {
          const app = appService.findApp(item.appId)!;

          return (
            <div
              key={item.id}
              className={"app-content" + (item.active ? " app-active" : "")}
              style={{}}
            >
              <app.component filePath={item.filePath}></app.component>
            </div>
          );
        })}
      </div>
    </div>
  );
};
