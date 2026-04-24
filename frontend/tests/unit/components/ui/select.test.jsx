import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SelectContent layering', () => {
    it('renders above modal overlays', () => {
        const source = readFileSync(join(process.cwd(), 'src/components/ui/select.jsx'), 'utf8');
        expect(source).toContain('z-[110]');
    });
});
