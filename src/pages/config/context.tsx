import type { TreeNode } from "@/lib/utils";
import type Environment from "@/lib/bovine-basic/environment";
import { nanoid } from "nanoid";
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
}>;

export interface FormEntry {
  id: string;
  label: string;
  formStructure: FormStructure;
}

export interface ConfigContextType {
  menuTrees: Record<string, MenuTreeNode[]>;
  setMenuTrees: React.Dispatch<
    React.SetStateAction<Record<string, MenuTreeNode[]>>
  >;
  gamePeriods: string[];
  forms: FormEntry[];
  setForms: React.Dispatch<React.SetStateAction<FormEntry[]>>;
  activeFormId: string | null;
  setActiveFormId: (id: string | null) => void;
  expressionEnvironment: Environment | null;
  setExpressionEnvironment: (env: Environment | null) => void;
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
    },
    {
      id: "utility",
      label: "Utility",
      type: "instantaneous",
    },
    {
      id: "offense",
      label: "Offense",
      type: "instantaneous",
      children: [
        {
          id: "magic",
          label: "Magic",
          type: "instantaneous",
          children: [
            {
              id: "fire",
              label: "Fire",
              type: "instantaneous",
            },
            {
              id: "ice",
              label: "Ice",
              type: "instantaneous",
            },
            {
              id: "lightning",
              label: "Lightning",
              type: "instantaneous",
            },
          ],
        },
        {
          id: "melee",
          label: "Melee",
          type: "instantaneous",
        },
        {
          id: "ranged",
          label: "Ranged",
          type: "instantaneous",
        },
      ],
    },
    {
      id: "support",
      label: "Support",
      type: "instantaneous",
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

  const defaultFormId = nanoid();
  const [forms, setForms] = useState<FormEntry[]>([
    {
      id: defaultFormId,
      label: "New Form",
      formStructure: { id: defaultFormId, rows: [] },
    },
  ]);
  const [activeFormId, setActiveFormId] = useState<string | null>(
    defaultFormId,
  );

  const [expressionEnvironment, setExpressionEnvironment] =
    useState<Environment | null>(null);

  return (
    <ConfigContext.Provider
      value={{
        menuTrees,
        setMenuTrees,
        gamePeriods,
        forms,
        setForms,
        activeFormId,
        setActiveFormId,
        expressionEnvironment,
        setExpressionEnvironment,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
