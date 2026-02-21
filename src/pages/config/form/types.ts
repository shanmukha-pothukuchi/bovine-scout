export interface EntityStructure {
  id: string;
}

export interface RowStructure {
  id: string;
  entities: EntityStructure[];
}

export interface FormStructure {
  id: string;
  rows: RowStructure[];
}
