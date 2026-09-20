import React from 'react';
import { render, screen } from '@testing-library/react';
import StoreMedia from '../StoreMedia';

describe('StoreMedia', () => {
  it('renders an img for still store images', () => {
    render(
      <StoreMedia
        url="https://example.com/store-images/time-turner-adventure.jpg"
        alt="Time Turner Adventure"
        className="thumb"
      />
    );

    const img = screen.getByRole('img', { name: 'Time Turner Adventure' });
    expect(img).toHaveAttribute(
      'src',
      'https://example.com/store-images/time-turner-adventure.jpg'
    );
    expect(img).toHaveClass('thumb');
    expect(screen.queryByLabelText('Welcome into Math Whiz')).not.toBeInTheDocument();
  });

  it('renders a looping muted video for mp4 store items', () => {
    render(
      <StoreMedia
        url="https://example.com/store-images/welcomeintomathwhiz-magic.mp4"
        alt="Welcome into Math Whiz"
        className="h-32 w-full object-cover"
      />
    );

    const video = screen.getByLabelText('Welcome into Math Whiz');
    expect(video).toHaveAttribute(
      'src',
      'https://example.com/store-images/welcomeintomathwhiz-magic.mp4'
    );
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders nothing without a url', () => {
    render(<StoreMedia url="" alt="Missing" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Missing')).not.toBeInTheDocument();
  });
});
