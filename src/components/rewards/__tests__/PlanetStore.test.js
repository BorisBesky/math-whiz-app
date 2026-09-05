import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlanetStore from '../PlanetStore';

jest.mock('../PlanetViewer', () => ({ visibleItems }) => <div data-testid="visible-items">{visibleItems.join(',')}</div>);

const props = (profile = { coins: 100 }) => ({
  userData: profile,
  handlePurchasePlanetItem: jest.fn().mockResolvedValue({ alreadyOwned: false }),
  handleSetPlanetItemActive: jest.fn().mockResolvedValue(),
});

test('previewing one item or the full world never spends coins or changes ownership', () => {
  const p = props();
  render(<PlanetStore {...p} />);
  expect(screen.getByTestId('visible-items')).toBeEmptyDOMElement();
  fireEvent.click(screen.getByRole('button', { name: /Preview Whispering woods/ }));
  expect(screen.getByTestId('visible-items')).toHaveTextContent('pine-forest');
  fireEvent.click(screen.getByRole('button', { name: 'Preview the complete world' }));
  expect(screen.getByTestId('visible-items')).toHaveTextContent('observatory');
  fireEvent.click(screen.getByRole('button', { name: 'Back to my planet' }));
  expect(screen.getByTestId('visible-items')).toBeEmptyDOMElement();
  expect(p.handlePurchasePlanetItem).not.toHaveBeenCalled();
});

test('a student with too few coins can preview but cannot buy', () => {
  render(<PlanetStore {...props({ coins: 4 })} />);
  fireEvent.click(screen.getByRole('button', { name: /Preview Whispering woods/ }));
  expect(screen.getByRole('button', { name: '11 more coins to go' })).toBeDisabled();
});

test('buying waits for saving and blocks repeated clicks before reporting success', async () => {
  const p = props();
  let complete;
  p.handlePurchasePlanetItem.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
  render(<PlanetStore {...p} />);
  fireEvent.click(screen.getByRole('button', { name: /Preview Whispering woods/ }));
  const buy = screen.getByRole('button', { name: 'Add to my planet · 15' });
  fireEvent.click(buy);
  fireEvent.click(buy);
  expect(p.handlePurchasePlanetItem).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Saving your planet…' })).toBeDisabled();
  complete({ alreadyOwned: false });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Whispering woods is yours'));
});

test('a failed save leaves the item purchasable and explains the failure', async () => {
  const p = props();
  p.handlePurchasePlanetItem.mockRejectedValue(new Error('Please try again.'));
  render(<PlanetStore {...p} />);
  fireEvent.click(screen.getByRole('button', { name: /Preview Whispering woods/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Add to my planet · 15' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please try again.');
  expect(screen.getByRole('button', { name: 'Add to my planet · 15' })).toBeEnabled();
});

test('owned items can be tucked away without a second purchase, and restored after remount', async () => {
  const p = props({ coins: 85, ownedPlanetItems: ['pine-forest'], activePlanetItems: ['pine-forest'] });
  const view = render(<PlanetStore {...p} />);
  fireEvent.click(screen.getByRole('button', { name: /Preview Whispering woods/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Tuck away' }));
  await waitFor(() => expect(p.handleSetPlanetItemActive).toHaveBeenCalledWith('pine-forest', false));
  expect(p.handlePurchasePlanetItem).not.toHaveBeenCalled();
  view.unmount();
  render(<PlanetStore {...props({ coins: 85, ownedPlanetItems: ['pine-forest'], activePlanetItems: [] })} />);
  expect(screen.getByTestId('visible-items')).toBeEmptyDOMElement();
  fireEvent.click(screen.getByRole('button', { name: /Preview Whispering woods/ }));
  expect(screen.getByRole('button', { name: 'Add to my planet' })).toBeEnabled();
});

test('category and collection filters work, including a new student’s empty collection', () => {
  render(<PlanetStore {...props()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Wonders', exact: true }));
  expect(screen.queryByRole('button', { name: /Preview Whispering woods/ })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Preview Crystal garden/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'My collection' }));
  expect(screen.getByText('Your collection is ready to grow.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Explore the shop' }));
  expect(screen.getByRole('button', { name: /Preview Whispering woods/ })).toBeInTheDocument();
});
