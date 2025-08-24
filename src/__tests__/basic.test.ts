/**
 * Simple test to verify testing setup
 */
describe('Test Environment', () => {
  it('should have basic functionality', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have DOM environment', () => {
    const div = document.createElement('div');
    div.textContent = 'test';
    expect(div.textContent).toBe('test');
  });

  it('should have localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
});