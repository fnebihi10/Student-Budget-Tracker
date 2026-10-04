import React from 'react';
import { act, create } from 'react-test-renderer';
import { useReportTotals } from '../useReportTotals';
import { completeMonthlyTotals } from '../../services/cloudClient';
jest.mock('../../services/cloudClient', () => ({ completeMonthlyTotals: jest.fn() }));

test('reports discard superseded aggregates, expose failure, and retry after confirmed history refresh', async () => {
  const requests = [];
  completeMonthlyTotals.mockImplementation((period, signal) => new Promise((resolve, reject) => requests.push({ period, signal, resolve, reject })));
  let current;
  function Probe({ period, history, account }) {
    current = useReportTotals(period, history, account);
    return null;
  }
  let renderer;
  const firstHistory = [];
  await act(async () => { renderer = create(<Probe period="2026-09" history={firstHistory} account="user-A" />); });
  await act(async () => { renderer.update(<Probe period="2026-10" history={firstHistory} account="user-A" />); });
  expect(requests[0].signal.aborted).toBe(true);
  await act(async () => { requests[0].resolve({ income: 100, expenses: 1, monthlyNet: 99 }); });
  expect(current).toBeUndefined();
  await act(async () => { requests[1].reject(new Error('Session refresh failed')); });
  expect(current.error).toBe(true);
  const refreshedHistory = [{ id: 'remote-change' }];
  await act(async () => { renderer.update(<Probe period="2026-10" history={refreshedHistory} account="user-A" />); });
  expect(current).toBeUndefined();
  await act(async () => { requests[2].resolve({ income: 50, expenses: 30, monthlyNet: 20 }); });
  expect(current.result).toEqual({ income: 50, expenses: 30, monthlyNet: 20 });
  await act(async () => { renderer.update(<Probe period="2026-10" history={refreshedHistory} />); });
  expect(current).toBeUndefined();
  expect(requests).toHaveLength(3);
  await act(async () => renderer.unmount());
});
