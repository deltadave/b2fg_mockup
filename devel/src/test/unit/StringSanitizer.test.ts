import { describe, it, expect, beforeEach } from 'vitest';
import { StringSanitizer, fixQuote, type SanitizationOptions } from '@/shared/utils/StringSanitizer';

describe('StringSanitizer', () => {
  describe('sanitizeForXML()', () => {
    it('should handle null and undefined inputs', () => {
      expect(StringSanitizer.sanitizeForXML(null)).toBe('');
      expect(StringSanitizer.sanitizeForXML(undefined)).toBe('');
      expect(StringSanitizer.sanitizeForXML('')).toBe('');
    });

    it('should convert non-string inputs to strings', () => {
      expect(StringSanitizer.sanitizeForXML(123)).toBe('123');
      expect(StringSanitizer.sanitizeForXML(true)).toBe('true');
      expect(StringSanitizer.sanitizeForXML(false)).toBe('false');
    });

    it('should encode HTML entities correctly', () => {
      const input = '<script>alert("XSS")</script>';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle ampersands first to avoid double-encoding', () => {
      const input = 'AT&T & Associates';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('AT&amp;T &amp; Associates');
    });

    it('should encode quotes and apostrophes', () => {
      const input = `He said "Hello" and she said 'Hi'`;
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('He said &quot;Hello&quot; and she said &#39;Hi&#39;');
    });

    it('should replace newlines and carriage returns by default', () => {
      const input = 'Line 1\nLine 2\rLine 3\r\nLine 4';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('Line 1 Line 2 Line 3  Line 4');
    });

    it('should preserve newlines when allowNewlines is true', () => {
      const input = 'Line 1\nLine 2';
      const result = StringSanitizer.sanitizeForXML(input, { allowNewlines: true });
      expect(result).toBe('Line 1\nLine 2');
    });

    it('should replace tabs by default', () => {
      const input = 'Column 1\tColumn 2\tColumn 3';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('Column 1 Column 2 Column 3');
    });

    it('should preserve tabs when allowTabs is true', () => {
      const input = 'Column 1\tColumn 2';
      const result = StringSanitizer.sanitizeForXML(input, { allowTabs: true });
      expect(result).toBe('Column 1\tColumn 2');
    });

    it('should remove control characters', () => {
      const input = 'Normal\x00\x01\x1FText\x7F';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('NormalText');
    });

    it('should remove dangerous protocols by default', () => {
      const input = 'javascript:alert("XSS") vbscript:msgbox("XSS") data:text/html,<script>';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('alert(&quot;XSS&quot;) msgbox(&quot;XSS&quot;) text&#x2F;html,&lt;script&gt;');
    });

    it('should preserve dangerous protocols when removeDangerousProtocols is false', () => {
      const input = 'javascript:alert("test")';
      const result = StringSanitizer.sanitizeForXML(input, { removeDangerousProtocols: false });
      expect(result).toBe('javascript:alert(&quot;test&quot;)');
    });

    it('should remove event handlers by default', () => {
      const input = 'onclick="alert(1)" onmouseover="evil()" onload="hack()"';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('&quot;alert(1)&quot; &quot;evil()&quot; &quot;hack()&quot;');
    });

    it('should preserve event handlers when removeEventHandlers is false', () => {
      const input = 'onclick="test"';
      const result = StringSanitizer.sanitizeForXML(input, { removeEventHandlers: false });
      expect(result).toBe('onclick&#x3D;&quot;test&quot;');
    });

    it('should respect maxLength option', () => {
      const input = 'This is a very long string that should be truncated';
      const result = StringSanitizer.sanitizeForXML(input, { maxLength: 20 });
      expect(result).toBe('This is a very long');
      expect(result.length).toBe(19); // After trimming
    });

    it('should normalize spaces when preserveSpaces is false', () => {
      const input = 'Multiple   spaces    here';
      const result = StringSanitizer.sanitizeForXML(input, { preserveSpaces: false });
      expect(result).toBe('Multiple spaces here');
    });

    it('should preserve multiple spaces when preserveSpaces is true (default)', () => {
      const input = 'Multiple   spaces    here';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('Multiple   spaces    here');
    });

    it('should trim whitespace from start and end', () => {
      const input = '   Leading and trailing spaces   ';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('Leading and trailing spaces');
    });
  });

  describe('sanitizeWithReport()', () => {
    it('should return detailed report for clean string', () => {
      const input = 'Clean text';
      const result = StringSanitizer.sanitizeWithReport(input);
      
      expect(result.sanitized).toBe('Clean text');
      expect(result.wasModified).toBe(false);
      expect(result.originalLength).toBe(10);
      expect(result.finalLength).toBe(10);
      expect(result.removedPatterns).toEqual([]);
    });

    it('should report detected dangerous patterns', () => {
      const input = 'javascript:alert(1) <script>evil()</script> onclick="hack()"';
      const result = StringSanitizer.sanitizeWithReport(input);
      
      expect(result.wasModified).toBe(true);
      expect(result.removedPatterns).toContain('javascript: protocol');
      expect(result.removedPatterns).toContain('event handlers');
    });

    it('should report control characters', () => {
      const input = 'Text\x00with\x01control\x1Fchars';
      const result = StringSanitizer.sanitizeWithReport(input);
      
      expect(result.removedPatterns).toContain('control characters');
      expect(result.sanitized).toBe('Textwithcontrolchars');
    });

    it('should handle empty input', () => {
      const result = StringSanitizer.sanitizeWithReport('');
      
      expect(result.sanitized).toBe('');
      expect(result.wasModified).toBe(false);
      expect(result.originalLength).toBe(0);
      expect(result.finalLength).toBe(0);
      expect(result.removedPatterns).toEqual([]);
    });
  });

  describe('sanitizeHTML()', () => {
    it('should decode common HTML entities', () => {
      const input = '&lt;p&gt;Hello &amp; goodbye&lt;/p&gt;';
      const result = StringSanitizer.sanitizeHTML(input);
      expect(result).toBe('<p>Hello & goodbye</p>');
    });

    it('should handle smart quotes and typography', () => {
      const input = '&rsquo;Hello&rdquo; &ndash; World &mdash; Test';
      const result = StringSanitizer.sanitizeHTML(input);
      expect(result).toBe("'Hello\" - World - Test");
    });

    it('should remove dangerous scripts and styles', () => {
      const input = '<p>Safe</p><script>alert("XSS")</script><style>body{display:none}</style>';
      const result = StringSanitizer.sanitizeHTML(input);
      expect(result).toBe('<p>Safe</p>');
    });

    it('should remove event handlers from HTML', () => {
      const input = '<div onclick="alert(1)" onmouseover="hack()">Content</div>';
      const result = StringSanitizer.sanitizeHTML(input);
      expect(result).toBe('<div>Content</div>');
    });

    it('should respect maxLength for HTML', () => {
      const input = '<p>This is a very long HTML content that should be truncated</p>';
      const result = StringSanitizer.sanitizeHTML(input, { maxLength: 30 });
      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('should handle newlines in HTML when allowNewlines is true', () => {
      const input = '<p>Line 1\nLine 2</p>';
      const result = StringSanitizer.sanitizeHTML(input, { allowNewlines: true });
      expect(result).toContain('\n');
    });
  });

  describe('sanitizeText()', () => {
    it('should perform basic text cleaning', () => {
      const input = 'Simple\x00text\x01with\x1Fcontrol\x7Fchars';
      const result = StringSanitizer.sanitizeText(input);
      expect(result).toBe('Simpletextwithcontrolchars');
    });

    it('should handle whitespace options', () => {
      const input = 'Line 1\nLine 2\tColumn';
      const result = StringSanitizer.sanitizeText(input, { allowNewlines: true, allowTabs: true });
      expect(result).toBe('Line 1\nLine 2\tColumn');
    });

    it('should normalize whitespace by default', () => {
      const input = 'Multiple   spaces\n\nhere';
      const result = StringSanitizer.sanitizeText(input);
      expect(result).toBe('Multiple spaces here');
    });
  });

  describe('escapeXMLAttribute()', () => {
    it('should escape XML-specific characters for attributes', () => {
      const input = '<tag attr="value & more">content</tag>';
      const result = StringSanitizer.escapeXMLAttribute(input);
      expect(result).toBe('&lt;tag attr=&quot;value &amp; more&quot;&gt;content&lt;/tag&gt;');
    });

    it('should handle quotes and apostrophes in attributes', () => {
      const input = `value="test" and 'another'`;
      const result = StringSanitizer.escapeXMLAttribute(input);
      expect(result).toBe('value=&quot;test&quot; and &#39;another&#39;');
    });

    it('should handle null and empty values', () => {
      expect(StringSanitizer.escapeXMLAttribute(null)).toBe('');
      expect(StringSanitizer.escapeXMLAttribute(undefined)).toBe('');
      expect(StringSanitizer.escapeXMLAttribute('')).toBe('');
    });
  });

  describe('isXMLSafe()', () => {
    it('should return true for safe strings', () => {
      expect(StringSanitizer.isXMLSafe('Safe text content')).toBe(true);
      expect(StringSanitizer.isXMLSafe('Numbers 123 and symbols !@#')).toBe(true);
      expect(StringSanitizer.isXMLSafe('')).toBe(true);
    });

    it('should return false for dangerous JavaScript', () => {
      expect(StringSanitizer.isXMLSafe('javascript:alert(1)')).toBe(false);
      expect(StringSanitizer.isXMLSafe('JAVASCRIPT:hack()')).toBe(false);
    });

    it('should return false for dangerous scripts', () => {
      expect(StringSanitizer.isXMLSafe('<script>evil()</script>')).toBe(false);
      expect(StringSanitizer.isXMLSafe('<SCRIPT>hack()</SCRIPT>')).toBe(false);
    });

    it('should return false for event handlers', () => {
      expect(StringSanitizer.isXMLSafe('onclick="alert(1)"')).toBe(false);
      expect(StringSanitizer.isXMLSafe('onmouseover="hack()"')).toBe(false);
    });

    it('should return false for control characters', () => {
      expect(StringSanitizer.isXMLSafe('text\x00with\x01control')).toBe(false);
      expect(StringSanitizer.isXMLSafe('text\x7Fwith\x1Fcontrol')).toBe(false);
    });

    it('should return true for safe whitespace characters', () => {
      expect(StringSanitizer.isXMLSafe('text\twith\ntabs\rand\rreturns')).toBe(true);
    });
  });

  describe('normalizeToASCII()', () => {
    it('should convert smart quotes to straight quotes', () => {
      const input = '\u201cHello\u201d and \u2018World\u2019';
      const result = StringSanitizer.normalizeToASCII(input);
      expect(result).toBe('"Hello" and \'World\'');
    });

    it('should convert dashes to hyphens', () => {
      const input = 'Test \u2013 with en\u2013dash \u2014 and em\u2014dash';
      const result = StringSanitizer.normalizeToASCII(input);
      expect(result).toBe('Test - with en-dash - and em-dash');
    });

    it('should convert ellipsis to three dots', () => {
      const input = 'Test\u2026more text';
      const result = StringSanitizer.normalizeToASCII(input);
      expect(result).toBe('Test...more text');
    });

    it('should convert accented characters', () => {
      const input = 'Caf\u00e9 na\u00efve r\u00e9sum\u00e9 pi\u00f1ata';
      const result = StringSanitizer.normalizeToASCII(input);
      expect(result).toBe('Cafe naive resume pinata');
    });

    it('should handle mixed case accented characters', () => {
      const input = '\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5 \u00e0\u00e1\u00e2\u00e3\u00e4\u00e5 \u00c8\u00c9\u00ca\u00cb \u00e8\u00e9\u00ea\u00eb';
      const result = StringSanitizer.normalizeToASCII(input);
      expect(result).toBe('AAAAAA aaaaaa EEEE eeee');
    });

    it('should handle null and empty inputs', () => {
      expect(StringSanitizer.normalizeToASCII(null)).toBe('');
      expect(StringSanitizer.normalizeToASCII(undefined)).toBe('');
      expect(StringSanitizer.normalizeToASCII('')).toBe('');
    });
  });

  describe('Legacy compatibility', () => {
    describe('fixQuote() function', () => {
      it('should work identically to StringSanitizer.sanitizeForXML()', () => {
        const testCases = [
          'Simple text',
          '<script>alert("XSS")</script>',
          'Text with "quotes" and \'apostrophes\'',
          'javascript:alert(1)',
          'Line 1\nLine 2\tTab',
          null,
          undefined,
          '',
          123
        ];

        testCases.forEach(testCase => {
          const legacyResult = fixQuote(testCase);
          const modernResult = StringSanitizer.sanitizeForXML(testCase);
          expect(legacyResult).toBe(modernResult);
        });
      });

      it('should maintain backward compatibility with existing code', () => {
        // Test specific patterns that existing code might rely on
        expect(fixQuote('<tag attr="value">')).toBe('&lt;tag attr&#x3D;&quot;value&quot;&gt;');
        expect(fixQuote('A & B')).toBe('A &amp; B');
        expect(fixQuote('"quoted text"')).toBe('&quot;quoted text&quot;');
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const result = StringSanitizer.sanitizeForXML(longString);
      expect(result.length).toBe(1000); // Default maxLength
    });

    it('should handle strings with only whitespace', () => {
      const input = '   \n\t\r   ';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('');
    });

    it('should handle mixed content types', () => {
      const input = 'Text with <tags> and "quotes" and \nnewlines\t and control\x00chars';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toBe('Text with &lt;tags&gt; and &quot;quotes&quot; and  newlines  and controlchars');
    });

    it('should handle circular references in objects', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const result = StringSanitizer.sanitizeForXML(circular);
      expect(result).toBe('[object Object]'); // toString() representation
    });

    it('should handle special Unicode characters', () => {
      const input = 'Unicode: \u2122 \u00a9 \u00ae \u2603 \ud83c\udf89';
      const result = StringSanitizer.sanitizeForXML(input);
      expect(result).toContain('Unicode:'); // Should preserve the basic structure
    });
  });

  describe('Performance considerations', () => {
    it('should handle reasonable processing time for large inputs', () => {
      const largeInput = 'Test string with various <tags> and "quotes" '.repeat(1000);
      
      const start = performance.now();
      const result = StringSanitizer.sanitizeForXML(largeInput);
      const end = performance.now();
      
      expect(result).toBeDefined();
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });
  });
});