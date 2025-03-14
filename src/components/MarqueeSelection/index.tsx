import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  CSSProperties,
  forwardRef,
  useImperativeHandle,
} from "react";
import "./index.css";

/** Interface for exposed methods */
export interface MarqueeSelectionRef {
  /** Reset selection state */
  reset: () => void;
}

interface MarqueeSelectionProps {
  /** React children elements that can be selected */
  children?: ReactNode;
  /** Callback fired when selection changes during drag
   * @param selectedItems - Array of currently selected DOM elements
   */
  onSelectionChange?: (selectedItems: Element[]) => void;
  /** Callback fired whenever the selection state changes (selection or deselection)
   * @param selectedItems - Array of currently selected DOM elements
   */
  onSelectedChange?: (selectedItems: Element[]) => void;
  /** Additional CSS class name for the container */
  className?: string;
  /** Additional CSS styles for the container */
  style?: CSSProperties;
  /** CSS class name for the selection box that appears while dragging */
  selectionBoxClassName?: string;
  /** CSS class name applied to selected items */
  selectedItemClassName?: string;
  /** Callback fired when selection is completed (on mouse up)
   * @param selectedItems - Array of finally selected DOM elements
   */
  onSelectionFinish?: (selectedItems: Element[]) => void;
  /** Callback fired when a selected item is double clicked
   * @param clickedItem - The double clicked DOM element
   * @param selectedItems - Array of all currently selected DOM elements
   */
  onSelectedItemDoubleClick?: (
    clickedItem: Element,
    selectedItems: Element[]
  ) => void;
  /** Callback to get context menu content for selected items
   * @param clickedItem - The right clicked DOM element
   * @param selectedItems - Array of all currently selected DOM elements
   * @param event - The original mouse event
   * @returns ReactNode to be rendered as context menu
   */
  contextMenuContent?: (
    event: MouseEvent,
    clickedItem: Element | null,
    selectedItems: Element[]
  ) => React.ReactNode;
}

export const MarqueeSelection = forwardRef<
  MarqueeSelectionRef,
  MarqueeSelectionProps
>((props, ref) => {
  const {
    children,
    onSelectionChange,
    onSelectionFinish,
    onSelectedItemDoubleClick,
    onSelectedChange,
    className = "",
    style,
    selectionBoxClassName = "marquee-selection-box",
    selectedItemClassName = "marquee-selection-item-selected",
    contextMenuContent,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const startPoint = useRef({ x: 0, y: 0 });
  const [selectedElements, setSelectedElements] = useState<Element[]>([]);

  const isDragging = useRef(false);

  const [menuProps, setMenuProps] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  // Handle double click event
  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const clickedChild = Array.from(container.children).find((child) =>
        elements.includes(child as Element)
      );

      if (clickedChild && selectedElements.includes(clickedChild)) {
        onSelectedItemDoubleClick?.(clickedChild, selectedElements);
      }
    },
    [selectedElements, onSelectedItemDoubleClick]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      const container = containerRef.current;
      if (!container) return;

      // Get clicked target element
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const clickedChild = Array.from(container.children).find((child) =>
        elements.includes(child as Element)
      );

      // Handle click selection logic if clicked on a child element
      if (clickedChild) {
        if (e.ctrlKey || e.metaKey) {
          setSelectedElements((prev) => {
            if (prev.includes(clickedChild)) {
              return prev.filter((el) => el !== clickedChild);
            } else {
              return [...prev, clickedChild];
            }
          });
        } else if (!selectedElements.includes(clickedChild)) {
          setSelectedElements([clickedChild]);
        }
        return;
      }

      // Start marquee selection when clicking on empty space
      const rect = container.getBoundingClientRect();
      startPoint.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      isDragging.current = false;
      setIsSelecting(true);

      // Clear selected elements if not holding Ctrl/Command
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedElements([]);
      }
    },
    [selectedElements]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting || !containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Only consider as dragging if moved more than 5 pixels
      const moveDistance = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.current.x, 2) +
          Math.pow(currentPoint.y - startPoint.current.y, 2)
      );

      if (moveDistance < 5) {
        return;
      }

      isDragging.current = true;

      const left = Math.min(startPoint.current.x, currentPoint.x);
      const top = Math.min(startPoint.current.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - startPoint.current.x);
      const height = Math.abs(currentPoint.y - startPoint.current.y);

      setSelectionBox({ left, top, width, height });

      // Check elements within selection bounds
      const selectionRect = {
        left: left + rect.left,
        top: top + rect.top,
        right: left + width + rect.left,
        bottom: top + height + rect.top,
      };

      // Get valid children (exclude selection box and internal elements)
      const validChildren = Array.from(container.children).filter(
        (child) =>
          !child.classList.contains("selection-box") &&
          !child.classList.contains("marquee-selection-internal")
      );

      const newSelectedElements = validChildren.filter((child) => {
        const childRect = child.getBoundingClientRect();
        const isInSelection = !(
          childRect.right < selectionRect.left ||
          childRect.left > selectionRect.right ||
          childRect.bottom < selectionRect.top ||
          childRect.top > selectionRect.bottom
        );

        // Preserve previous selection if holding Ctrl/Command
        if (e.ctrlKey || e.metaKey) {
          return isInSelection || selectedElements.includes(child);
        }
        return isInSelection;
      });

      setSelectedElements(newSelectedElements);
      onSelectionChange?.(newSelectedElements);
    },
    [isSelecting, onSelectionChange, selectedElements]
  );

  // Apply styles when selectedElements change
  useEffect(() => {
    const styles = selectedItemClassName.split(" ");
    // Add styles to all selected elements
    selectedElements.forEach((element) => {
      element.classList.add(...styles);
    });

    return () => {
      // Clean up styles only for elements that are no longer selected
      selectedElements.forEach((element) => {
        element.classList.remove(...styles);
      });
    };
  }, [selectedElements, selectedItemClassName]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    isDragging.current = false;
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 });
    // Trigger callback when selection is complete
    onSelectionFinish?.(selectedElements);
  }, [selectedElements, onSelectionFinish]);

  // Add context menu handler
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container || !contextMenuContent) return;

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const clickedChild = Array.from(container.children).find(
        (child) =>
          elements.includes(child as Element) &&
          !child.classList.contains("selection-box") &&
          !child.classList.contains("marquee-selection-internal")
      );

      if (clickedChild && selectedElements.includes(clickedChild)) {
        setMenuProps({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          content: contextMenuContent(e, clickedChild, selectedElements),
        });
        return;
      }

      if (clickedChild) {
        setSelectedElements([clickedChild]);
        setMenuProps({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          content: contextMenuContent(e, clickedChild, [clickedChild]),
        });
        return;
      }

      // 点击空白处
      setMenuProps({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        content: contextMenuContent(e, null, selectedElements),
      });
    },
    [selectedElements, contextMenuContent]
  );

  // Add click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuProps((prev) => ({ ...prev, visible: false }));
    };

    if (menuProps.visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuProps.visible]);

  // Reset method implementation
  const reset = useCallback(() => {
    setSelectedElements([]);
    setIsSelecting(false);
    isDragging.current = false;
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 });
  }, []);

  // Expose methods to parent
  useImperativeHandle(
    ref,
    () => ({
      reset,
    }),
    [reset]
  );

  // Event listeners setup and cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("dblclick", handleDoubleClick); // Add double click event listener
    container.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("dblclick", handleDoubleClick); // Clean up double click event listener
      container.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleContextMenu,
  ]);

  // Cleanup styles on component unmount
  useEffect(() => {
    return () => {
      const styles = selectedItemClassName.split(" ");
      selectedElements.forEach((element) => {
        element.classList.remove(...styles);
      });
    };
  }, [selectedElements, selectedItemClassName]);

  useEffect(() => {
    onSelectedChange?.(selectedElements);
  }, [selectedElements]);

  return (
    <>
      <div
        ref={containerRef}
        className={`marquee-selection-container ${className}`}
        style={style}
      >
        {children}
        {isSelecting && isDragging.current && (
          <div
            className={`${selectionBoxClassName} selection-box marquee-selection-internal`}
            style={{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`,
            }}
          />
        )}
      </div>
      {menuProps.visible && (
        <div
          className="marquee-selection-menu"
          style={{
            left: menuProps.x,
            top: menuProps.y,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {menuProps.content}
        </div>
      )}
    </>
  );
});
