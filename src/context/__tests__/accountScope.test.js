import React from 'react';
import { act, create } from 'react-test-renderer';
import App from '../../../App';
import { supabase } from '../../lib/supabase';
import { fetchBudgetData, fetchRows } from '../../services/cloudData';

let mockAuthCallback;
let mockSnapshot;
let mockAuthActions;
jest.mock('../../lib/supabase', () => ({ clearPersistedSession: jest.fn(async()=>{}), supabase: { auth: {
  getSession: jest.fn(async () => ({ data: { session: { user: { id: 'A', email: 'a@example.test' } } } })),
  onAuthStateChange: jest.fn((callback) => { mockAuthCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; }),
  signOut: jest.fn(async()=>({error:null})), signInWithPassword: jest.fn(),
} } }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../../services/cloudData', () => ({
  fetchBudgetData: jest.fn(), fetchRows: jest.fn(),
  transactionFromRow: (row) => row, billFromRow: (row) => row,
  goalFromRow: (row) => row, splitFromRow: (row) => row, subscriptionFromRow: (row) => row,
}));
jest.mock('../../navigation/AppNavigator', () => {
  const React = require('react');
  const { BudgetContext } = require('../BudgetContext');
  const { GoalsContext } = require('../GoalsContext');
  const { SplitsContext } = require('../SplitsContext');
  const { SubscriptionsContext } = require('../SubscriptionsContext');
  const { AuthContext } = require('../AuthContext');
  return function Probe() {
    mockAuthActions = React.useContext(AuthContext);
    mockSnapshot = [React.useContext(BudgetContext).transactions, React.useContext(GoalsContext).goals, React.useContext(SplitsContext).splits, React.useContext(SubscriptionsContext).subscriptions];
    return null;
  };
});
const cloud = (id) => ({ profile: { name: id }, settings: {}, transactions: [{ id, amount: 1 }], bills: [] });

test('actual provider tree never exposes A to B, signed-out, or demo after delayed loads', async () => {
  const resolvers = [];
  fetchBudgetData.mockImplementation((user) => user.id === 'A' ? new Promise((resolve) => resolvers.push(() => resolve(cloud('private A')))) : Promise.resolve(cloud('B')));
  fetchRows.mockImplementation((table, id) => id === 'A' ? new Promise((resolve) => resolvers.push(() => resolve([{ id: 'private A' }]))) : Promise.resolve([{ id: 'B' }]));
  let renderer;
  await act(async () => { renderer = create(<App />); });
  await act(async () => { mockAuthCallback('SIGNED_OUT', null); });
  expect(mockSnapshot.flat()).toEqual([]);
  await act(async () => { mockAuthActions.startDemo(); });
  expect(mockSnapshot.flat().every((row) => row.id.startsWith('demo'))).toBe(true);
  expect(mockSnapshot.flat().some((row) => row.id === 'B' || row.id === 'private A')).toBe(false);
  await act(async () => { mockAuthCallback('SIGNED_IN', { user: { id: 'B', email: 'b@example.test' } }); });
  expect(mockSnapshot.flat().map((row) => row.id)).toEqual(['B', 'B', 'B', 'B']);
  await act(async () => { for (const resolve of resolvers) resolve(); });
  expect(mockSnapshot.flat().map((row) => row.id)).toEqual(['B', 'B', 'B', 'B']);
  await act(async () => { mockAuthCallback('SIGNED_OUT', null); });
  expect(mockSnapshot.flat()).toEqual([]);
  expect(supabase.auth.getSession).toHaveBeenCalled();
  await act(async () => renderer.unmount());
});

test('new login is blocked until prior signout cleanup finishes', async()=>{
  fetchBudgetData.mockImplementation(async(user)=>cloud(user.id));
  fetchRows.mockResolvedValue([]);
  let resolve;
  supabase.auth.signOut.mockImplementationOnce(()=>new Promise((done)=>{resolve=done;}));
  supabase.auth.signInWithPassword.mockClear();
  let renderer, signingOut;
  await act(async()=>{renderer=create(<App/>);});
  await act(async()=>{ signingOut=mockAuthActions.signOut(); });
  const attempt=await mockAuthActions.signIn('b@example.test','password');
  expect(attempt.error.message).toContain('still closing');
  expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  await act(async()=>{resolve({error:null});await signingOut;});
  expect(mockAuthActions.user).toBeNull();
  await act(async()=>renderer.unmount());
});
