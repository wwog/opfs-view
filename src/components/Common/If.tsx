import React from "react";

//#region component Types
export interface IfProps {
  condition: boolean;
  children?: React.ReactNode;
}
export interface ElseIfProps {
  condition: boolean;
  children?: React.ReactNode;
}
export interface ElseProps {
  children?: React.ReactNode;
}

export interface ThenProps {
  children?: React.ReactNode;
}
//#endregion component Types

const ElseIf: React.FC<ElseIfProps> = (props) => {
  return <>{props.children}</>;
};
ElseIf.displayName = "ElseIf";

const Else: React.FC<ElseProps> = (props) => {
  return <>{props.children}</>;
};
Else.displayName = "Else";

/**
 * Rendering children when condition is true, can optionally use for alignment and organization
 */
const Then: React.FC<ThenProps> = (props) => {
  return <>{props.children}</>;
};
Then.displayName = "Then";

//#region component
/**
 * Render children when condition is true, can contain multiple ElseIfs and one Else
 */
export const If: React.FC<IfProps> & {
  ElseIf: React.FC<ElseIfProps>;
  Else: React.FC<ElseProps>;
  Then: React.FC<ThenProps>;
} = (props) => {
  const { condition, children } = props;

  const elseIfComponents: React.ReactElement<ElseIfProps>[] = [];
  const ifComponents: React.ReactNode[] = [];
  let elseComponent: React.ReactElement<ElseProps> | null = null;

  React.Children.forEach(children, (child) => {
    //如果是string, isValidElement会返回false,但我们需要显示root下的文本
    if (React.isValidElement(child)) {
      if (
        child.type &&
        (child.type as typeof ElseIf).displayName === "ElseIf"
      ) {
        elseIfComponents.push(child as React.ReactElement<ElseIfProps>);
        return;
      }
      if (child.type && (child.type as typeof Else).displayName === "Else") {
        elseComponent = child as React.ReactElement<ElseProps>;
        return;
      }
    }
    ifComponents.push(child);
  });

  if (condition) {
    return <>{ifComponents}</>;
  }

  for (const elseIf of elseIfComponents) {
    if (elseIf.props.condition) {
      return <>{elseIf.props.children}</>;
    }
  }

  if (elseComponent) {
    return (
      <>{(elseComponent as React.ReactElement<ElseProps>).props.children}</>
    );
  }

  return null;
};
If.ElseIf = ElseIf;
If.Else = Else;
If.Then = Then;
//#endregion component
