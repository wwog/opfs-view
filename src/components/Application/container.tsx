import { FC } from "react";
import "./index.css";
import { ApplicationSelector } from "./selector";
import { useAppService } from "../../services/appService/useAppService";
import { If } from "../Common/If";

export const ApplicationContainer: FC = () => {
  const { opened, appService } = useAppService();
  return (
    <div className="app-container">
      <ApplicationSelector />

      <div className="app-content-container">
        <If condition={opened.length > 0}>
          {opened.map((item) => {
            const app = appService.findApp(item.appId)!;

            return (
              <div
                key={item.id}
                className={"app-content" + (item.active ? " app-active" : "")}
              >
                <app.component
                  filePath={item.filePath}
                  extName={item.extName}
                ></app.component>
              </div>
            );
          })}

          <If.Else>
            <div className="app-content app-active app-no-opened">
              <div className="app-empty">No application opened</div>
            </div>
          </If.Else>
        </If>
      </div>
    </div>
  );
};
