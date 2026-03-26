import { describe, expect, it } from 'vitest';
import { getFinanceScopeLabels, resolveFinanceScope } from './context';

describe('finance context helpers', () => {
    it('resolves personal scope when there is no active family', () => {
        expect(resolveFinanceScope({ activeFamilyId: null, families: [] })).toEqual({
            scope: 'personal',
            familyId: null,
            familyName: null,
        });
    });

    it('resolves family scope from explicit family id and labels it with the family name', () => {
        const t = (key, params) => {
            if (key === 'common.personal') return 'Personal';
            if (key === 'common.family') return 'Family';
            if (key === 'common.familyNamed') return `Family ${params.name}`;
            return key;
        };

        expect(
            getFinanceScopeLabels(t, {
                activeFamilyId: null,
                familyId: 'family-2',
                families: [
                    { id: 'family-1', name: 'Alpha' },
                    { id: 'family-2', name: 'Beta' },
                ],
            })
        ).toMatchObject({
            scope: 'family',
            familyId: 'family-2',
            familyName: 'Beta',
            scopeLabel: 'Family',
            scopeTargetLabel: 'Family Beta',
        });
    });
});
