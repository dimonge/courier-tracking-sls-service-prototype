export type CommonUserType  = {
  created_at: Date;
  modified_at: Date;
  deleted_at?: Date | null;
}

export type CommonTimestampType = {
  created_by: number;
  modified_by: number;
  deleted_by?: number | null;
}