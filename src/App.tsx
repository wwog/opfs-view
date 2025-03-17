import { FC } from "react";
import { Allotment } from "allotment";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { OpfsViewer } from "./components/OpfsViewer";
import { isOPFSSupported } from "@happy-js/happy-opfs";
import { Toaster } from "react-hot-toast";
import { ApplicationContainer } from "./components/Application/container";

export const App: FC = () => {
  const [sizes, setSizes] = useLocalStorage("sizes", [2, 2.5]);

  if (isOPFSSupported() === false) {
    return <div>Current Browser Not Support OPFS</div>;
  }

  return (
    <Allotment
      separator
      defaultSizes={sizes}
      onChange={(sizes) => {
        setSizes(sizes, true);
      }}
    >
      <Allotment.Pane snap minSize={160} maxSize={720} preferredSize={410}>
        <Toaster position="bottom-left" />
        <OpfsViewer />
      </Allotment.Pane>
      <Allotment.Pane>
        <ApplicationContainer />
      </Allotment.Pane>
    </Allotment>
  );
};
