import { IconArrowLeft, IconX } from "@tabler/icons-react";
import { Component } from "react";

export interface MenuItem {
  id: string;
  label: string;
  children?: MenuItem[];
}

interface MenuStyles {
  className?: string;

  centerRadius: number;
  baseRadius: number;
  radiusStep: number;
  strokeWidth: number;
  maxLayerArcLength: number;
  maxItemArcLength: number;

  fontSize: number;
  iconSize: number;
}

interface RadialMenuProps {
  menu: MenuItem[];
  style?: Partial<MenuStyles>;
  value?: MenuItem["id"];
  onSelect?: (id: MenuItem["id"]) => void;
  onNavigation?: (path: MenuItem["id"][]) => void;
}

interface ArcParams {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  sweepAngle: number;
}

interface TextParams {
  label: string;
  labelAngle: number;
  labelRadius: number;
}

type MenuParams = { arc: ArcParams; text: TextParams };

interface RadialMenuState {
  activePath: MenuItem["id"][];
}

class RadialMenu extends Component<RadialMenuProps, RadialMenuState> {
  static defaultProps = {
    style: {
      centerRadius: 40,
      baseRadius: 120,
      radiusStep: 75,
      strokeWidth: 2,
      maxLayerArcLength: 600,
      maxItemArcLength: 100,

      fontSize: 14,
      iconSize: 20,
    },
  } as const;

  constructor(props: RadialMenuProps) {
    super(props);
    this.state = { activePath: [] };
  }

  componentDidUpdate(
    previousProps: Readonly<RadialMenuProps>,
    previousState: Readonly<RadialMenuState>,
  ) {
    if (this.props.value && this.props.value !== previousProps.value) {
      const path = this.getPathById(this.props.menu, this.props.value);
      if (path) {
        this.setState({ activePath: path.slice(0, -1) });
      }
    }

    if (this.state.activePath !== previousState.activePath) {
      this.props.onNavigation?.(this.state.activePath);
    }
  }

  render() {
    const {
      className,
      centerRadius,
      strokeWidth,
      baseRadius,
      radiusStep,
      fontSize,
      iconSize,
    } = this.props.style as MenuStyles;

    const visibleMenu = this.getVisibleMenu(
      this.props.menu,
      this.state.activePath,
    );

    const padding = strokeWidth / 2;
    const maxDepth = this.getMaxDepth(visibleMenu);
    const maxRadius = baseRadius + (maxDepth - 1) * radiusStep + padding;
    const containerSize = maxRadius * 2;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;

    const menuParams = this.getMenuParams(visibleMenu);

    return (
      <div
        className={`${className || ""}`}
        style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
      >
        <svg
          className="block text-foreground"
          viewBox={`0 0 ${containerSize} ${containerSize}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          {Array.from(menuParams).map(([id, params]) => {
            const adjustedArcParams = {
              ...params.arc,
              centerX: centerX + params.arc.centerX,
              centerY: centerY + params.arc.centerY,
            };
            const pathData = this.getArcPath(adjustedArcParams);
            const item = this.getItemById(this.props.menu, id);

            return (
              <g
                key={id}
                onClick={() => this.handleItemClick(id, item)}
                className="cursor-pointer select-none"
              >
                <path
                  d={pathData}
                  fill="currentColor"
                  strokeWidth={strokeWidth}
                  className="cursor-pointer text-popover stroke-border"
                />
                <text
                  x={
                    centerX +
                    params.text.labelRadius *
                      Math.sin((params.text.labelAngle * Math.PI) / 180)
                  }
                  y={
                    centerY -
                    params.text.labelRadius *
                      Math.cos((params.text.labelAngle * Math.PI) / 180)
                  }
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="currentColor"
                  fontSize={fontSize}
                  className="cursor-pointer select-none"
                >
                  {params.text.label}
                </text>
              </g>
            );
          })}

          <g
            onClick={() => this.handleCenterClick()}
            className="cursor-pointer select-none"
          >
            <circle
              r={centerRadius}
              cx={centerX}
              cy={centerY}
              strokeWidth={strokeWidth}
              fill="currentColor"
              className="cursor-pointer text-popover stroke-border"
            />

            <g
              className="[&_path]:stroke-foreground"
              transform={`translate(${centerX}, ${centerY})`}
            >
              <g
                transform={`translate(${-iconSize / 2}, ${-iconSize / 2})`}
                className="cursor-pointer select-none"
              >
                {this.state.activePath.length > 0 ? (
                  <IconArrowLeft width={iconSize} height={iconSize} />
                ) : (
                  <IconX width={iconSize} height={iconSize} />
                )}
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }

  private handleCenterClick() {
    this.setState((state) => {
      if (state.activePath.length === 0) return state;

      const originalDepth = this.getMaxDepth(
        this.getVisibleMenu(this.props.menu, state.activePath),
      );

      const newPath = state.activePath.slice(0, -1);
      while (newPath.length > 0) {
        const newDepth = this.getMaxDepth(
          this.getVisibleMenu(this.props.menu, newPath),
        );
        if (newDepth < originalDepth) break;

        newPath.pop();
      }

      return {
        activePath: newPath,
      };
    });
  }

  private handleItemClick(id: MenuItem["id"], item: MenuItem | null) {
    const isLeaf = item && (!item.children || item.children.length === 0);

    this.setState((state) => {
      const isActive = state.activePath[state.activePath.length - 1] === id;
      if (isActive) return state;

      if (
        isLeaf &&
        this.getItemById(
          this.props.menu,
          state.activePath[state.activePath.length - 1],
        )?.children?.some((child) => child.id === id)
      ) {
        return state;
      }

      return {
        activePath: this.getPathById(this.props.menu, id) || state.activePath,
      };
    });

    if (isLeaf) {
      this.props.onSelect?.(id);
    }
  }

  private getVisibleMenu(menu: MenuItem[], path: MenuItem["id"][]): MenuItem[] {
    const visibleMenu: MenuItem[] = menu.map((item) => ({
      ...item,
      children: [] as MenuItem[],
    }));

    let currentLevel = visibleMenu;

    for (const activeId of path) {
      const activeItem = this.getItemById(menu, activeId);

      if (!activeItem?.children) break;

      const targetItem = currentLevel.find((item) => item.id === activeId);

      if (targetItem) {
        targetItem.children = activeItem.children.map((child) => ({
          ...child,
          children: [] as MenuItem[],
        }));

        currentLevel = targetItem.children;
      }
    }

    return visibleMenu;
  }

  private getPathById(menu: MenuItem[], targetId: string): string[] | null {
    const stack: { node: MenuItem; path: string[] }[] = menu.map((item) => ({
      node: item,
      path: [item.id],
    }));

    while (stack.length > 0) {
      const { node, path } = stack.pop()!;

      if (node.id === targetId) return path;

      if (node.children) {
        for (const child of node.children) {
          stack.push({
            node: child,
            path: [...path, child.id],
          });
        }
      }
    }

    return null;
  }

  private getItemById(menu: MenuItem[], id: MenuItem["id"]): MenuItem | null {
    const stack = [...menu];

    while (stack.length > 0) {
      const item = stack.pop()!;
      if (item.id === id) return item;
      if (item.children) stack.push(...item.children);
    }

    return null;
  }

  private getMaxDepth(menu: MenuItem[]): number {
    let depth = 0;
    const queue = [menu];

    while (queue.length > 0) {
      const levelSize = queue.length;
      depth++;

      for (let i = 0; i < levelSize; i++) {
        const items = queue.shift()!;
        for (const item of items) {
          if (item.children?.length) {
            queue.push(item.children);
          }
        }
      }
    }

    return depth;
  }

  private getMenuParams(menu: MenuItem[]): Map<MenuItem["id"], MenuParams> {
    const menuItemArcParams = new Map<MenuItem["id"], MenuParams>();
    const {
      baseRadius,
      radiusStep,
      centerRadius,
      maxLayerArcLength,
      maxItemArcLength,
    } = this.props.style as MenuStyles;

    interface MenuNode {
      item: MenuItem;
      parent: MenuItem | null;
      depth: number;
    }

    const stack: MenuNode[] = menu.map((item) => ({
      item,
      parent: null,
      depth: 0,
    }));

    while (stack.length > 0) {
      const node = stack.pop()!;

      const outerRadius =
        node.depth === 0 ? baseRadius : baseRadius + node.depth * radiusStep;
      const innerRadius =
        node.depth === 0 ? centerRadius : outerRadius - radiusStep;

      const parentParams = node.parent
        ? menuItemArcParams.get(node.parent.id)!
        : null;
      const items = node.parent ? node.parent.children! : menu;

      let menuAngleSpan;
      if (node.depth === 0) {
        menuAngleSpan = 360;
      } else {
        const arcRadius = (innerRadius + outerRadius) / 2;
        let maxLayerAngle = (maxLayerArcLength / arcRadius) * (180 / Math.PI);
        let maxItemAngle = (maxItemArcLength / arcRadius) * (180 / Math.PI);

        menuAngleSpan = Math.min(
          items.length * Math.min(360 / items.length, maxItemAngle),
          maxLayerAngle,
        );
      }

      const parentCenterAngle = parentParams
        ? parentParams.arc.startAngle + parentParams.arc.sweepAngle / 2
        : 0;
      const anglePerItem = menuAngleSpan / items.length;
      const angleStart =
        parentCenterAngle -
        (node.depth === 0 ? anglePerItem / 2 : menuAngleSpan / 2);
      const index = items.indexOf(node.item);
      const startAngle = angleStart + index * anglePerItem;

      menuItemArcParams.set(node.item.id, {
        arc: {
          centerX: 0,
          centerY: 0,
          innerRadius,
          outerRadius,
          startAngle,
          sweepAngle: anglePerItem,
        },
        text: {
          label: node.item.label,
          labelAngle: startAngle + anglePerItem / 2,
          labelRadius: (innerRadius + outerRadius) / 2,
        },
      });

      if (node.item.children) {
        for (const child of node.item.children) {
          stack.push({ item: child, parent: node.item, depth: node.depth + 1 });
        }
      }
    }

    return menuItemArcParams;
  }

  private getArcPath({
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    startAngle,
    sweepAngle,
  }: ArcParams): string {
    if (!sweepAngle) return `M ${centerX} ${centerY}`;

    startAngle %= 360;
    sweepAngle %= 360;
    if (sweepAngle < 0) sweepAngle += 360;

    if (sweepAngle === 360 || sweepAngle === 0) {
      return `
                M ${centerX} ${centerY - outerRadius}
                A ${outerRadius} ${outerRadius} 0 1 1 ${centerX} ${centerY + outerRadius}
                A ${outerRadius} ${outerRadius} 0 1 1 ${centerX} ${centerY - outerRadius}
                M ${centerX} ${centerY - innerRadius}
                A ${innerRadius} ${innerRadius} 0 1 0 ${centerX} ${centerY + innerRadius}
                A ${innerRadius} ${innerRadius} 0 1 0 ${centerX} ${centerY - innerRadius}
                Z`;
    }

    const largeArc = sweepAngle > 180 ? 1 : 0;
    const a1 = (startAngle * Math.PI) / 180;
    const a2 = ((startAngle + sweepAngle) * Math.PI) / 180;

    const x1Outer = centerX + outerRadius * Math.sin(a1);
    const y1Outer = centerY - outerRadius * Math.cos(a1);
    const x2Outer = centerX + outerRadius * Math.sin(a2);
    const y2Outer = centerY - outerRadius * Math.cos(a2);

    const x1Inner = centerX + innerRadius * Math.sin(a1);
    const y1Inner = centerY - innerRadius * Math.cos(a1);
    const x2Inner = centerX + innerRadius * Math.sin(a2);
    const y2Inner = centerY - innerRadius * Math.cos(a2);

    return `
		    M ${x1Outer} ${y1Outer}
		    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
		    L ${x2Inner} ${y2Inner}
		    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
	        Z`;
  }
}

export default RadialMenu;
