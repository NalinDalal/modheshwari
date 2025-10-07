
/**
 * Jest Setup File for UI Package
 * 
 * Configures the Jest testing environment for the UI component library.
 * Imports jest-dom to extend Jest matchers with DOM-specific assertions.
 * 
 * Available matchers from @testing-library/jest-dom:
 * - toBeInTheDocument()
 * - toBeVisible()
 * - toBeEmpty()
 * - toHaveTextContent()
 * - toHaveAttribute()
 * - toHaveClass()
 * - And many more...
 * 
 * @module JestSetup
 * @see {@link https://github.com/testing-library/jest-dom} for available matchers
 * @see {@link https://testing-library.com/docs/react-testing-library/intro/} for React Testing Library docs
 * 
 * @example
 * // Using jest-dom matchers in tests
 * test('button is visible', () => {
 *   render(<Button>Click me</Button>);
 *   expect(screen.getByRole('button')).toBeInTheDocument();
 * });
 * 
 * @example
 * // Checking element attributes
 * test('link has correct href', () => {
 *   render(<Card href="https://example.com" title="Test" />);
 *   expect(screen.getByRole('link')).toHaveAttribute('href');
 * });
 */

import '@testing-library/jest-dom';
