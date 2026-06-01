export interface ApiResponse<T> {
  data: T;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
}
