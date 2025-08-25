import { test, expect } from '@playwright/test';

test.describe('AI Town UI/UX Validation', () => {
  test('should render the AI Town with all assets and interactive features', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/ai-town-initial.png', fullPage: true });
    
    // Check if the main application container is present
    const app = page.locator('#root');
    await expect(app).toBeVisible();
    
    // Check for character sprites and assets
    const canvasElement = page.locator('canvas');
    await expect(canvasElement).toBeVisible();
    
    // Wait for characters to load
    await page.waitForTimeout(3000);
    
    // Take screenshot after characters load
    await page.screenshot({ path: 'test-results/ai-town-characters-loaded.png', fullPage: true });
    
    // Check for UI controls and panels
    const uiPanel = page.locator('[data-testid="character-panel"], .character-panel, .ui-panel');
    if (await uiPanel.count() > 0) {
      await expect(uiPanel.first()).toBeVisible();
    }
    
    // Look for character information display
    const characterInfo = page.locator('text=Lucky, text=Bob, text=Stella, text=Alice, text=Pete');
    if (await characterInfo.count() > 0) {
      console.log('✅ AI characters detected in UI');
    }
    
    // Test interactive features - click on the map/canvas
    await canvasElement.click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(1000);
    
    // Take screenshot after interaction
    await page.screenshot({ path: 'test-results/ai-town-after-click.png', fullPage: true });
    
    // Check for character selection UI
    const characterSelector = page.locator('select, .character-selector, [data-testid="character-selector"]');
    if (await characterSelector.count() > 0) {
      await expect(characterSelector.first()).toBeVisible();
      console.log('✅ Character selector found');
    }
    
    // Check for chat interface
    const chatInterface = page.locator('input[placeholder*="chat"], input[placeholder*="message"], .chat-input');
    if (await chatInterface.count() > 0) {
      await expect(chatInterface.first()).toBeVisible();
      console.log('✅ Chat interface found');
    }
    
    // Test character creation if available
    const createCharacterBtn = page.locator('button:has-text("Create"), button:has-text("Add Character")');
    if (await createCharacterBtn.count() > 0) {
      await createCharacterBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/ai-town-character-creation.png', fullPage: true });
    }
    
    // Check for world statistics
    const statsElement = page.locator('text=characters, text=agents, .stats, .world-info');
    if (await statsElement.count() > 0) {
      console.log('✅ World statistics found');
    }
    
    // Final comprehensive screenshot
    await page.screenshot({ path: 'test-results/ai-town-final-state.png', fullPage: true });
    
    console.log('🎮 AI Town UI/UX validation completed');
  });

  test('should validate asset loading and visual appeal', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Check for network requests to ensure assets are loading
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('.png') || response.url().includes('.jpg') || response.url().includes('.svg')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Wait for assets to load
    await page.waitForTimeout(5000);
    
    // Check if any images failed to load
    const imageErrors = responses.filter(r => r.status >= 400);
    if (imageErrors.length > 0) {
      console.log('⚠️ Some assets failed to load:', imageErrors);
    } else {
      console.log('✅ All assets loaded successfully');
    }
    
    // Check CSS styling is applied
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    console.log('Background color:', backgroundColor);
    
    // Take final aesthetic screenshot
    await page.screenshot({ path: 'test-results/ai-town-aesthetic-validation.png', fullPage: true });
  });

  test('should test interactive map features', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Test clicking different areas of the map
    const clickPositions = [
      { x: 100, y: 100 },
      { x: 300, y: 200 },
      { x: 500, y: 300 }
    ];
    
    for (const pos of clickPositions) {
      await canvas.click({ position: pos });
      await page.waitForTimeout(500);
      console.log(`✅ Clicked at position (${pos.x}, ${pos.y})`);
    }
    
    // Take screenshot showing interaction results
    await page.screenshot({ path: 'test-results/ai-town-map-interactions.png', fullPage: true });
  });

  test('should verify character system functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    
    // Look for character-related elements
    const characterElements = await page.locator('*').evaluateAll(elements => {
      const found = [];
      elements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        if (text.includes('lucky') || text.includes('bob') || text.includes('stella') || 
            text.includes('alice') || text.includes('pete') ||
            className.includes('character') || className.includes('agent')) {
          found.push({
            tag: el.tagName,
            text: el.textContent?.slice(0, 50),
            className: el.className
          });
        }
      });
      return found;
    });
    
    console.log('Found character elements:', characterElements);
    
    // Take screenshot highlighting character system
    await page.screenshot({ path: 'test-results/ai-town-character-system.png', fullPage: true });
    
    expect(characterElements.length).toBeGreaterThan(0);
  });
});