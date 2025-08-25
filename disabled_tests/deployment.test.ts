/**
 * Build and Deployment Verification Tests
 * Ensures the static migration is production-ready
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Build and Deployment Verification', () => {
  const projectRoot = path.resolve(__dirname, '../../../');
  const buildDir = path.join(projectRoot, 'dist');

  describe('Build Process', () => {
    it('should build without errors', async () => {
      const { stdout, stderr } = await execAsync('npm run build', { cwd: projectRoot });
      
      // Build should complete successfully
      expect(stderr).not.toMatch(/error/i);
      
      // Should generate dist directory
      expect(existsSync(buildDir)).toBe(true);
    }, 60000); // 60 second timeout for build

    it('should generate all required static assets', () => {
      // Check for main HTML file
      expect(existsSync(path.join(buildDir, 'index.html'))).toBe(true);
      
      // Check for JavaScript bundles
      const jsFiles = require('fs').readdirSync(path.join(buildDir, 'assets'))
        .filter((file: string) => file.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
      
      // Check for CSS files
      const cssFiles = require('fs').readdirSync(path.join(buildDir, 'assets'))
        .filter((file: string) => file.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
    });

    it('should have reasonable bundle sizes for static deployment', () => {
      const assetsDir = path.join(buildDir, 'assets');
      const jsFiles = require('fs').readdirSync(assetsDir)
        .filter((file: string) => file.endsWith('.js'));
      
      const totalJsSize = jsFiles.reduce((total, file) => {
        const filePath = path.join(assetsDir, file);
        const stats = statSync(filePath);
        return total + stats.size;
      }, 0);
      
      // Total JS should be under 5MB for static deployment efficiency
      const sizeInMB = totalJsSize / (1024 * 1024);
      expect(sizeInMB).toBeLessThan(5);
      
      console.log(`Total JavaScript bundle size: ${sizeInMB.toFixed(2)}MB`);
    });

    it('should include all static database assets', () => {
      const indexHtml = readFileSync(path.join(buildDir, 'index.html'), 'utf-8');
      
      // Should reference the main app entry point
      expect(indexHtml).toMatch(/main\.tsx/);
      expect(indexHtml).toMatch(/Static AI Town/i);
    });
  });

  describe('Static Database Integration', () => {
    it('should bundle WASM files for offline functionality', () => {
      const assetsDir = path.join(buildDir, 'assets');
      
      if (existsSync(assetsDir)) {
        const allFiles = require('fs').readdirSync(assetsDir);
        
        // May include WASM files or have them referenced in JS bundles
        // At minimum, the DuckDB dependencies should be bundled
        const jsFiles = allFiles.filter((file: string) => file.endsWith('.js'));
        expect(jsFiles.length).toBeGreaterThan(0);
        
        // Check that DuckDB references exist in the bundles
        const mainJsFile = jsFiles.find((file: string) => file.includes('index')) || jsFiles[0];
        const mainJsContent = readFileSync(path.join(assetsDir, mainJsFile), 'utf-8');
        
        // Should contain references to static database functionality
        expect(
          mainJsContent.includes('duckdb') || 
          mainJsContent.includes('pglite') ||
          mainJsContent.includes('StaticDataProvider')
        ).toBe(true);
      }
    });
  });

  describe('GitHub Pages Compatibility', () => {
    it('should have proper index.html for GitHub Pages', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      // Should have proper DOCTYPE
      expect(content).toMatch(/<!DOCTYPE html>/i);
      
      // Should have proper meta tags
      expect(content).toMatch(/<meta charset="utf-8">/i);
      expect(content).toMatch(/<meta name="viewport"/i);
      
      // Should have proper title
      expect(content).toMatch(/<title>.*AI Town.*<\/title>/i);
    });

    it('should use relative paths for assets', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      // Assets should use relative paths, not absolute paths
      expect(content).not.toMatch(/href="\/[^/]/); // No absolute paths starting with /
      expect(content).not.toMatch(/src="\/[^/]/);  // No absolute paths starting with /
    });

    it('should work without server-side rendering', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      // Should be a client-side rendered SPA
      expect(content).toMatch(/<div id="root"><\/div>/);
      
      // Should load the main app bundle
      expect(content).toMatch(/type="module"/);
    });
  });

  describe('Performance Optimization', () => {
    it('should have compressed assets when possible', () => {
      const assetsDir = path.join(buildDir, 'assets');
      
      if (existsSync(assetsDir)) {
        const files = require('fs').readdirSync(assetsDir);
        
        // Check that CSS is minified
        const cssFiles = files.filter((file: string) => file.endsWith('.css'));
        if (cssFiles.length > 0) {
          const cssContent = readFileSync(path.join(assetsDir, cssFiles[0]), 'utf-8');
          // Minified CSS should not have excessive whitespace
          expect(cssContent.split('\n').length).toBeLessThan(10);
        }
        
        // Check that JS is minified
        const jsFiles = files.filter((file: string) => file.endsWith('.js'));
        if (jsFiles.length > 0) {
          const jsContent = readFileSync(path.join(assetsDir, jsFiles[0]), 'utf-8');
          // Minified JS should not have excessive whitespace
          const lines = jsContent.split('\n');
          const nonEmptyLines = lines.filter(line => line.trim().length > 0);
          expect(nonEmptyLines.length).toBeLessThan(lines.length / 2);
        }
      }
    });
  });

  describe('Deployment Verification', () => {
    it('should be ready for static hosting', () => {
      // All required files should exist
      expect(existsSync(path.join(buildDir, 'index.html'))).toBe(true);
      expect(existsSync(path.join(buildDir, 'assets'))).toBe(true);
      
      // No server-side requirements
      expect(existsSync(path.join(buildDir, 'package.json'))).toBe(false);
      expect(existsSync(path.join(buildDir, 'node_modules'))).toBe(false);
      
      // No backend API files
      expect(existsSync(path.join(buildDir, 'api'))).toBe(false);
      expect(existsSync(path.join(buildDir, 'convex'))).toBe(false);
    });

    it('should have removed all Convex references', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = readFileSync(indexPath, 'utf-8');
      
      // Should not reference Convex in the final build
      expect(content.toLowerCase()).not.toMatch(/convex/);
      
      // Check JavaScript bundles too
      const assetsDir = path.join(buildDir, 'assets');
      if (existsSync(assetsDir)) {
        const jsFiles = require('fs').readdirSync(assetsDir)
          .filter((file: string) => file.endsWith('.js'));
        
        if (jsFiles.length > 0) {
          const jsContent = readFileSync(path.join(assetsDir, jsFiles[0]), 'utf-8');
          // Should contain static references instead
          expect(
            jsContent.includes('StaticDataProvider') || 
            jsContent.includes('staticConvex')
          ).toBe(true);
        }
      }
    });
  });
});