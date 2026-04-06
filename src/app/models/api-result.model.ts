/** Matches backend <c>ApiResult&lt;T&gt;</c> (camelCase JSON). */
export interface ApiResult<T> {
  status: boolean;
  messageCode: string;
  messageAr?: string | null;
  messageEn?: string | null;
  data?: T;
  count?: number;
  errors?: Array<{ field: string; messageCode: string; messageAr?: string; messageEn?: string }>;
}
