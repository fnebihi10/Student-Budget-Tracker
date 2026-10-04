import { useEffect, useState } from 'react';
import { completeMonthlyTotals } from '../services/cloudClient';
type Totals = Awaited<ReturnType<typeof completeMonthlyTotals>>;
export function useReportTotals(period: string, confirmedHistory: unknown, accountId: string | undefined) {
  const [snapshot, setSnapshot] = useState<{ period: string; history: unknown; result?: Totals; error: boolean }>({ period, history: confirmedHistory, error: false });
  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    let live = true;
    void completeMonthlyTotals(period, controller.signal).then((result) => {
      if (live) setSnapshot({ period, history: confirmedHistory, result, error: false });
    }).catch(() => {
      if (live) setSnapshot({ period, history: confirmedHistory, error: true });
    });
    return () => { live = false; controller.abort(); };
  }, [period, confirmedHistory, accountId]);
  return accountId && snapshot.period === period && snapshot.history === confirmedHistory ? snapshot : undefined;
}
