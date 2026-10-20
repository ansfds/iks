import { describe, expect, it } from 'vitest';
import { safeMediaUrl, safeNavigationUrl } from './media-url';
describe('durable media and service links', () => {
  it('allows versioned assets and hosted HTTPS images', () => {
    expect(safeMediaUrl('/images/gift-cards/xbox.svg')).toBe(true);
    expect(safeMediaUrl('https://cdn.example/image.png')).toBe(true);
  });
  it('rejects browser-only files, local hosts, unsafe paths and executable links', () => {
    for (const value of ['blob:https://example/id', 'file:///C:/photo.png', 'data:image/png;base64,AAAA', 'http://example/image.png', 'https://localhost/image.png', '/images/../.env', '//example/image.png']) expect(safeMediaUrl(value), value).toBe(false);
    for (const value of ['javascript:alert(1)', '//example.com', '/\\example.com', '/path\nunsafe']) expect(safeNavigationUrl(value), value).toBe(false);
  });
});
