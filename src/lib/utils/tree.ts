export type TreeNode<T = {}> = {
  id: string;
  children?: Array<TreeNode<T>>;
} & T;

export function findPath<T extends TreeNode>(
  nodes: T[],
  targetId: TreeNode["id"],
): TreeNode["id"][] | null {
  const stack: { node: T; path: TreeNode["id"][] }[] = nodes.map((item) => ({
    node: item,
    path: [item.id],
  }));

  while (stack.length > 0) {
    const { node, path } = stack.pop()!;

    if (node.id === targetId) return path;

    if (node.children) {
      for (const child of node.children as T[]) {
        stack.push({
          node: child,
          path: [...path, child.id],
        });
      }
    }
  }

  return null;
}

export function findNode<T extends TreeNode>(
  nodes: T[],
  id: TreeNode["id"],
): T | null {
  const stack = [...nodes];

  while (stack.length > 0) {
    const item = stack.pop()!;
    if (item.id === id) return item;
    if (item.children) stack.push(...(item.children as T[]));
  }

  return null;
}

export function depth<T extends TreeNode>(nodes: T[]): number {
  let d = 0;
  const queue: T[][] = [nodes];

  while (queue.length > 0) {
    const levelSize = queue.length;
    d++;

    for (let i = 0; i < levelSize; i++) {
      const items = queue.shift()!;
      for (const item of items) {
        if (item.children?.length) {
          queue.push(item.children as T[]);
        }
      }
    }
  }

  return d;
}

export function findParent<T extends TreeNode>(
  nodes: T[],
  childId: TreeNode["id"],
): T | null {
  const stack = [...nodes];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.children?.some((child) => (child as T).id === childId)) {
      return node;
    }
    if (node.children) {
      stack.push(...(node.children as T[]));
    }
  }

  return null;
}

export function hasDescendant<T extends TreeNode>(
  parent: T,
  childId: TreeNode["id"],
): boolean {
  const stack = [...(parent.children as T[])];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.id === childId) return true;
    if (node.children) stack.push(...(node.children as T[]));
  }

  return false;
}

export function isLeafNode<T extends TreeNode>(node: T | null): boolean {
  return node !== null && (!node.children || node.children.length === 0);
}

export function remove<T extends TreeNode>(
  nodes: T[],
  targetId: TreeNode["id"],
): T[] {
  const process = (items: T[]): T[] => {
    return items
      .filter((n) => n.id !== targetId)
      .map((n) =>
        n.children ? ({ ...n, children: process(n.children as T[]) } as T) : n,
      );
  };

  return process(nodes);
}

export function insert<T extends TreeNode>(
  nodes: T[],
  parentId: TreeNode["id"] | null,
  index: number,
  node: T,
): T[] {
  if (parentId === null) {
    const copy = [...nodes];
    copy.splice(index, 0, node);
    return copy;
  }

  const process = (items: T[]): T[] => {
    return items.map((n) => {
      if (n.id === parentId) {
        const children = [...(n.children as T[])];
        children.splice(index, 0, node);
        return { ...n, children } as T;
      }

      return n.children
        ? ({
            ...n,
            children: process(n.children as T[]),
          } as T)
        : n;
    });
  };

  return process(nodes);
}

export function indexOfChild<T extends TreeNode>(
  targetId: TreeNode["id"],
  parent: T | null,
  nodes: T[],
): number {
  const siblings = parent ? ((parent.children as T[]) ?? []) : nodes;
  return siblings.findIndex((n) => n.id === targetId);
}

export function update<T extends TreeNode>(
  nodes: T[],
  targetId: TreeNode["id"],
  updates: Partial<Omit<T, "id" | "children">>,
): T[] {
  const process = (items: T[]): T[] => {
    return items.map((node) => {
      if (node.id === targetId) return { ...node, ...updates };
      if (node.children)
        return { ...node, children: process(node.children as T[]) } as T;
      return node;
    });
  };

  return process(nodes);
}
