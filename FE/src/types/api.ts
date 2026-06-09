export interface ApiResponse<T> {
  success: boolean;
  message: string;
  /** Stable BE error code when success=false */
  code?: string;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
