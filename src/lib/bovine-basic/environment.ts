import type { RuntimeVal } from "./values";

export default class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeVal>;

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv;
    this.variables = new Map();
  }

  /**
   * Sets a variable in the nearest scope where it already exists,
   * or declares it in the current scope if it doesn't exist anywhere.
   * BovineBASIC uses plain `=` for both declaration and assignment.
   */
  public setVar(varName: string, value: RuntimeVal): RuntimeVal {
    if (this.variables.has(varName)) {
      this.variables.set(varName, value);
      return value;
    }

    if (this.parent && this.parent.has(varName)) {
      return this.parent.setVar(varName, value);
    }

    this.variables.set(varName, value);
    return value;
  }

  /**
   * Assigns to a variable that must already exist (used for index/member assignment).
   */
  public assignVar(varName: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(varName);
    env.variables.set(varName, value);
    return value;
  }

  public lookupVar(varName: string): RuntimeVal {
    const env = this.resolve(varName);
    return env.variables.get(varName) as RuntimeVal;
  }

  public has(varName: string): boolean {
    if (this.variables.has(varName)) return true;
    return this.parent?.has(varName) ?? false;
  }

  public resolve(varName: string): Environment {
    if (this.variables.has(varName)) return this;

    if (!this.parent) {
      throw new Error(`Cannot resolve '${varName}' as it does not exist.`);
    }

    return this.parent.resolve(varName);
  }
}
