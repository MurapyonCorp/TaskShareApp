export type PostgresErrorLike = {
  code: string;
};

export function isPostgresError(error: unknown): error is PostgresErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
