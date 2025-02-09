// types/index.ts
export interface User {
  id: string;
  name: string;
  surname: string;
  email?: string;
  gender: string;
  bloodGroup?: string;
  // Add other fields from your schema
}

export interface Family {
  id: number;
  name: string;
  description?: string;
  headId?: string;
  // Add other fields from your schema
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  // Add other fields from your schema
}
