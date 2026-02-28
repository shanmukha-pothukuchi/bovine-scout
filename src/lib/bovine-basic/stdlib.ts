import Environment from "./environment";
import {
  type RuntimeVal,
  type ArrayVal,
  type NumberVal,
  MAKE_DICT,
  MAKE_NATIVE_FN,
  MAKE_NUMBER,
  MAKE_UNIT,
} from "./values";

function requireNumberArray(args: RuntimeVal[], fnName: string): number[] {
  const arg = args[0];
  if (!arg || arg.type !== "array") {
    throw new Error(`stat.${fnName}: expected an array argument`);
  }
  return (arg as ArrayVal).elements.map((el, i) => {
    if (el.type !== "number") {
      throw new Error(`stat.${fnName}: element ${i} is not a number`);
    }
    return (el as NumberVal).value;
  });
}

const statMean = MAKE_NATIVE_FN((args) => {
  const nums = requireNumberArray(args, "mean");
  if (nums.length === 0) return MAKE_UNIT();
  return MAKE_NUMBER(nums.reduce((a, b) => a + b, 0) / nums.length);
});

const statMedian = MAKE_NATIVE_FN((args) => {
  const nums = requireNumberArray(args, "median").slice().sort((a, b) => a - b);
  if (nums.length === 0) return MAKE_UNIT();
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 0) {
    return MAKE_NUMBER((nums[mid - 1] + nums[mid]) / 2);
  }
  return MAKE_NUMBER(nums[mid]);
});

const statMode = MAKE_NATIVE_FN((args) => {
  const nums = requireNumberArray(args, "mode");
  if (nums.length === 0) return MAKE_UNIT();

  const freq = new Map<number, number>();
  for (const n of nums) {
    freq.set(n, (freq.get(n) ?? 0) + 1);
  }

  let maxCount = 0;
  let mode = nums[0];
  freq.forEach((count, val) => {
    if (count > maxCount) {
      maxCount = count;
      mode = val;
    }
  });

  return MAKE_NUMBER(mode);
});

const statRange = MAKE_NATIVE_FN((args) => {
  const nums = requireNumberArray(args, "range");
  if (nums.length === 0) return MAKE_UNIT();
  return MAKE_NUMBER(Math.max(...nums) - Math.min(...nums));
});

// Descriptor of all top-level builtins and their members.
// Extend this to add new builtin namespaces or functions.
export const STDLIB: Record<string, Record<string, RuntimeVal>> = {
  stat: {
    mean: statMean,
    median: statMedian,
    mode: statMode,
    range: statRange,
  },
};

export const STDLIB_MEMBER_NAMES: string[] = Object.entries(STDLIB).flatMap(
  ([ns, members]) => Object.keys(members).map((fn) => `${ns}.${fn}`),
);

export function createGlobalEnvironment(): Environment {
  const env = new Environment();

  for (const [name, members] of Object.entries(STDLIB)) {
    const entries = new Map<string, RuntimeVal>(Object.entries(members));
    env.setVar(name, MAKE_DICT(entries));
  }

  return env;
}
