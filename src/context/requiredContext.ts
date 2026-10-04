import { useContext, type Context } from 'react';
export function useRequiredContext<T>(context: Context<T | undefined>): T {
  const value = useContext(context);
  if (value === undefined) throw new Error('This screen requires its application provider.');
  return value;
}
