import React from "react";
import css from "./index.module.css";

interface ListProps {
  children: React.ReactNode;
}

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ListItem: React.FC<ListItemProps> = (props) => {
  const { children, ...rest } = props;
  return (
    <div className={css.item} {...rest}>
      {children}
    </div>
  );
};

export const List: React.FC<ListProps> & { Item: typeof ListItem } = ({
  children,
}) => {
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={() => {
        const customEvent = new Event("mousedown", {
          bubbles: true,
        });
        document.dispatchEvent(customEvent);
      }}
      className={css.list}
    >
      {children}
    </div>
  );
};

List.Item = ListItem;

export { ListItem };
export type { ListProps, ListItemProps };
