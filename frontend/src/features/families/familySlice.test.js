import { describe, it, expect } from 'vitest';
import reducer, { setActiveFamily } from './familySlice';

const baseState = {
  activeFamilyId: null,
  families: [{ id: 'f1', name: 'Fam 1', members: [] }],
  loading: false,
  error: null,
};

describe('familySlice reducers', () => {
  it('setActiveFamily updates activeFamilyId', () => {
    const next = reducer(baseState, setActiveFamily('f1'));
    expect(next.activeFamilyId).toBe('f1');
  });

  it('createFamily.fulfilled only clears loading and waits for refetch', () => {
    const state = { ...baseState, loading: true };
    const action = { type: 'families/createFamily/fulfilled', payload: { id: 'f2', name: 'New' } };
    const next = reducer(state, action);
    expect(next.loading).toBe(false);
    expect(next.families).toHaveLength(1);
  });

  it('inviteMember.fulfilled adds member to family', () => {
    const state = { ...baseState, families: [{ id: 'f1', members: [] }] };
    const action = { type: 'families/inviteMember/fulfilled', payload: { familyId: 'f1', member: { id: 'm1' } } };
    const next = reducer(state, action);
    expect(next.families[0].members[0].id).toBe('m1');
  });

  it('removeMemberFromFamily.fulfilled removes member', () => {
    const state = { ...baseState, families: [{ id: 'f1', members: [{ id: 'm1' }, { id: 'm2' }] }] };
    const action = { type: 'families/removeMember/fulfilled', payload: { familyId: 'f1', userId: 'm1' } };
    const next = reducer(state, action);
    expect(next.families[0].members).toHaveLength(1);
    expect(next.families[0].members[0].id).toBe('m2');
  });
});
