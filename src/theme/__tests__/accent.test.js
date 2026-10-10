import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { ACCENT, BUTTON_SHAPE, buttonClasses } from '../accent';
import { PortalButton, IconButton } from '../../components/portal/PortalUI';

describe('interactive accent', () => {
  test('the shared primary button uses the site blue', () => {
    render(<PortalButton variant="primary">Save</PortalButton>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white');
    expect(button.className).not.toMatch(/purple|indigo|violet/);
    expect(ACCENT.primaryButton).toBe('bg-blue-600 text-white hover:bg-blue-700');
  });

  test('every shared button variant uses the 12px button radius and a focus ring', () => {
    expect(BUTTON_SHAPE).toBe('rounded-button');
    ['primary', 'secondary', 'ghost', 'danger'].forEach((variant) => {
      render(<PortalButton variant={variant}>{variant}</PortalButton>);
      const button = screen.getByRole('button', { name: variant });
      expect(button).toHaveClass('rounded-button', 'focus-visible:ring-2', 'focus-visible:ring-blue-500');
      expect(button.className).not.toMatch(/\brounded-(?:md|lg)\b/);
    });
    expect(buttonClasses({ variant: 'primary', size: 'lg' })).toContain('rounded-button');
  });

  test('icon button tones no longer include purple', () => {
    const Icon = () => <svg />;
    render(<IconButton icon={Icon} label="Goals" tone="purple" />);
    expect(screen.getByRole('button', { name: 'Goals' }).className).not.toMatch(/purple/);
  });

  // Drift guard: interactive UI in the portal, account and guest screens must
  // use the blue accent. Purple is only allowed in the listed decorative spots.
  const SRC = path.resolve(__dirname, '../..');
  const DIRS = ['components/portal', 'components/account', 'components/guest'];
  const FILES = [
    'components/EditClassForm.js',
    'components/CreateClassForm.js',
    'components/StoreImagesManager.js',
    'components/PortalApp.js',
  ];
  // Nothing in these screens is purple any more. The admin role badge
  // (AppHeader) and the AI-generation modal header bands are purple on
  // purpose but live outside the scanned files.
  const ALLOWED = [];
  const PURPLE_CLASS = /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via|accent|outline|decoration|fill|stroke)-(?:brand-purple|purple|indigo|violet)\b/;

  const listFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });

  test('portal, account and guest UI use no stray purple accents', () => {
    const files = [
      ...DIRS.flatMap((d) => listFiles(path.join(SRC, d))),
      ...FILES.map((f) => path.join(SRC, f)),
    ];
    const offenders = [];
    files.forEach((file) => {
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (PURPLE_CLASS.test(line) && !ALLOWED.some((ok) => line.includes(ok))) {
          offenders.push(`${path.relative(SRC, file)}:${i + 1}: ${line.trim()}`);
        }
      });
    });
    expect(offenders).toEqual([]);
  });

  test('portal and account UI keep Baloo 2 (font-display) out of their titles', () => {
    const files = [
      ...['components/portal', 'components/account'].flatMap((d) => listFiles(path.join(SRC, d))),
      ...FILES.map((f) => path.join(SRC, f)),
    ];
    const offenders = files.filter((file) => /\bfont-display\b/.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(SRC, file));
    expect(offenders).toEqual([]);
  });
});
