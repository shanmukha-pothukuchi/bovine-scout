import type { TreeNode } from "@/lib/utils";
import type Environment from "@/lib/bovine-basic/environment";
import type { FormState } from "@/lib/form-builder";
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
  menuItemIds: string[];
  formStructure: FormStructure;
  formState: FormState;
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

  const makeDefaultTree = (): MenuTreeNode[] => [
    { id: nanoid(), label: "Defense", type: "instantaneous" },
    { id: nanoid(), label: "Utility", type: "instantaneous" },
    {
      id: nanoid(),
      label: "Offense",
      type: "instantaneous",
      children: [
        {
          id: nanoid(),
          label: "Magic",
          type: "instantaneous",
          children: [
            { id: nanoid(), label: "Fire", type: "instantaneous" },
            { id: nanoid(), label: "Ice", type: "instantaneous" },
            { id: nanoid(), label: "Lightning", type: "instantaneous" },
          ],
        },
        { id: nanoid(), label: "Melee", type: "instantaneous" },
        { id: nanoid(), label: "Ranged", type: "instantaneous" },
      ],
    },
    { id: nanoid(), label: "Support", type: "instantaneous" },
  ];

  const [menuTrees, setMenuTrees] = useState<Record<string, MenuTreeNode[]>>(
    () => {
      const trees: Record<string, MenuTreeNode[]> = {};
      for (const period of gamePeriods) {
        trees[period] = makeDefaultTree();
      }
      return trees;
    },
  );

  const defaultFormId = nanoid();
  const [forms, setForms] = useState<FormEntry[]>([
    {
      id: defaultFormId,
      label: "New Form",
      menuItemIds: [],
      formStructure: { id: defaultFormId, rows: [] },
      formState: {},
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
