import type { TreeNode } from "@/lib/utils";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { FormStructure } from "./form/types";

export type MenuTreeNode = TreeNode<{
  label: string;
  type?: "instantaneous" | "duration";
  includeForm?: boolean;
}>;

export interface ConfigContextType {
  menuTrees: Record<string, MenuTreeNode[]>;
  setMenuTrees: React.Dispatch<
    React.SetStateAction<Record<string, MenuTreeNode[]>>
  >;
  gamePeriods: string[];
  formStructure: FormStructure;
  setFormStructure: React.Dispatch<React.SetStateAction<FormStructure>>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [gamePeriods] = useState<string[]>([
    "Autonomous",
    "Tele-Operation",
    "End Game",
  ]);

  const defaultTree: MenuTreeNode[] = [
    {
      id: "defense",
      label: "Defense",
      type: "instantaneous",
      includeForm: false,
    },
    {
      id: "utility",
      label: "Utility",
      type: "instantaneous",
      includeForm: false,
    },
    {
      id: "offense",
      label: "Offense",
      type: "instantaneous",
      includeForm: false,
      children: [
        {
          id: "magic",
          label: "Magic",
          type: "instantaneous",
          includeForm: false,
          children: [
            {
              id: "fire",
              label: "Fire",
              type: "instantaneous",
              includeForm: false,
            },
            {
              id: "ice",
              label: "Ice",
              type: "instantaneous",
              includeForm: false,
            },
            {
              id: "lightning",
              label: "Lightning",
              type: "instantaneous",
              includeForm: false,
            },
          ],
        },
        {
          id: "melee",
          label: "Melee",
          type: "instantaneous",
          includeForm: false,
        },
        {
          id: "ranged",
          label: "Ranged",
          type: "instantaneous",
          includeForm: false,
        },
      ],
    },
    {
      id: "support",
      label: "Support",
      type: "instantaneous",
      includeForm: false,
    },
  ];

  const [menuTrees, setMenuTrees] = useState<Record<string, MenuTreeNode[]>>(
    () => {
      const trees: Record<string, MenuTreeNode[]> = {};
      for (const period of gamePeriods) {
        trees[period] = [...defaultTree];
      }
      return trees;
    },
  );

  const [formStructure, setFormStructure] = useState<FormStructure>({
    id: "form",
    rows: [],
  });

  return (
    <ConfigContext.Provider
      value={{
        menuTrees,
        setMenuTrees,
        gamePeriods,
        formStructure,
        setFormStructure,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
