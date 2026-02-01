import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  stripHtml,
  sanitizeUrl,
  isUrlSafe,
  sanitizeFilename,
  hasAllowedExtension,
  isValidIdentifier,
  sanitizeIdentifier,
  safeJsonParse,
  escapeHtml,
  escapeRegex,
  normalizeString,
  normalizeEmail,
} from '../sanitize'

// ============================================
// HTML Sanitization
// ============================================

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>'
    expect(sanitizeHtml(input)).toBe('<p>Hello</p>')
  })

  it('removes onclick handlers', () => {
    const input = '<button onclick="alert(1)">Click</button>'
    // Button is not in allowed tags, so it's removed
    expect(sanitizeHtml(input)).not.toContain('onclick')
  })

  it('removes onerror handlers', () => {
    const input = '<img onerror="alert(1)" src="x">'
    expect(sanitizeHtml(input)).not.toContain('onerror')
  })

  it('preserves allowed tags', () => {
    const input = '<p>Hello <strong>World</strong></p>'
    expect(sanitizeHtml(input)).toBe('<p>Hello <strong>World</strong></p>')
  })

  it('preserves safe links', () => {
    const input = '<a href="https://example.com">Link</a>'
    expect(sanitizeHtml(input)).toContain('href="https://example.com"')
  })

  it('removes javascript: URLs from links', () => {
    const input = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })

  it('removes style tags', () => {
    const input = '<style>.hack { display: none; }</style><p>Text</p>'
    expect(sanitizeHtml(input)).toBe('<p>Text</p>')
  })

  it('removes iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe><p>Safe</p>'
    expect(sanitizeHtml(input)).toBe('<p>Safe</p>')
  })

  it('removes form elements', () => {
    const input = '<form action="/steal"><input type="text"></form>'
    expect(sanitizeHtml(input)).toBe('')
  })

  it('handles empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('handles null/undefined', () => {
    expect(sanitizeHtml(null as never)).toBe('')
    expect(sanitizeHtml(undefined as never)).toBe('')
  })

  it('preserves tables', () => {
    const input = '<table><tr><td>Cell</td></tr></table>'
    expect(sanitizeHtml(input)).toContain('<table>')
    expect(sanitizeHtml(input)).toContain('<td>Cell</td>')
  })
})

describe('stripHtml', () => {
  it('removes all HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>'
    expect(stripHtml(input)).toBe('Hello World')
  })

  it('removes nested tags', () => {
    const input = '<div><p><span>Nested</span></p></div>'
    expect(stripHtml(input)).toBe('Nested')
  })

  it('handles script content', () => {
    const input = '<script>alert("xss")</script>Safe text'
    expect(stripHtml(input)).toBe('Safe text')
  })

  it('preserves plain text', () => {
    const input = 'Plain text without HTML'
    expect(stripHtml(input)).toBe('Plain text without HTML')
  })

  it('handles empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})

// ============================================
// URL Sanitization
// ============================================

describe('sanitizeUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('allows mailto URLs', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
  })

  it('allows tel URLs', () => {
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890')
  })

  it('allows relative paths', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page')
    expect(sanitizeUrl('./relative')).toBe('./relative')
    expect(sanitizeUrl('../parent')).toBe('../parent')
  })

  it('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('')
    expect(sanitizeUrl('  javascript:alert(1)')).toBe('')
  })

  it('blocks data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('blocks vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('')
  })

  it('blocks file: URLs', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBe('')
  })

  it('handles empty input', () => {
    expect(sanitizeUrl('')).toBe('')
  })

  it('handles whitespace', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
  })
})

describe('isUrlSafe', () => {
  it('returns true for safe URLs', () => {
    expect(isUrlSafe('https://example.com')).toBe(true)
    expect(isUrlSafe('/path')).toBe(true)
  })

  it('returns false for unsafe URLs', () => {
    expect(isUrlSafe('javascript:void(0)')).toBe(false)
    expect(isUrlSafe('data:text/html')).toBe(false)
  })
})

// ============================================
// Filename Sanitization
// ============================================

describe('sanitizeFilename', () => {
  it('removes path traversal sequences', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etc-passwd')
    expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windows-system32')
  })

  it('removes dangerous characters', () => {
    expect(sanitizeFilename('file<script>.txt')).toBe('file-script-.txt')
    expect(sanitizeFilename('file:name.txt')).toBe('file-name.txt')
    expect(sanitizeFilename('file"name.txt')).toBe('file-name.txt')
  })

  it('replaces spaces with dashes', () => {
    expect(sanitizeFilename('my file name.pdf')).toBe('my-file-name.pdf')
  })

  it('removes consecutive dashes', () => {
    expect(sanitizeFilename('file---name.txt')).toBe('file-name.txt')
  })

  it('removes leading/trailing dashes', () => {
    expect(sanitizeFilename('-filename-.txt')).toBe('filename-.txt')
  })

  it('respects max length', () => {
    const longName = 'a'.repeat(300) + '.txt'
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255)
  })

  it('handles custom options', () => {
    expect(sanitizeFilename('my file.txt', { replacement: '_' })).toBe('my_file.txt')
    expect(sanitizeFilename('longname.txt', { maxLength: 10 })).toBe('longname.t')
  })

  it('handles empty input', () => {
    expect(sanitizeFilename('')).toBe('')
  })
})

describe('hasAllowedExtension', () => {
  it('returns true for allowed extensions', () => {
    expect(hasAllowedExtension('document.pdf', ['pdf', 'docx'])).toBe(true)
    expect(hasAllowedExtension('image.PNG', ['png', 'jpg'])).toBe(true) // case insensitive
  })

  it('returns false for disallowed extensions', () => {
    expect(hasAllowedExtension('script.exe', ['pdf', 'docx'])).toBe(false)
    expect(hasAllowedExtension('file.php', ['html', 'css'])).toBe(false)
  })

  it('handles files without extension', () => {
    expect(hasAllowedExtension('noextension', ['pdf'])).toBe(false)
  })
})

// ============================================
// Identifier Validation
// ============================================

describe('isValidIdentifier', () => {
  it('allows valid identifiers', () => {
    expect(isValidIdentifier('user_id')).toBe(true)
    expect(isValidIdentifier('UserName')).toBe(true)
    expect(isValidIdentifier('_private')).toBe(true)
    expect(isValidIdentifier('column1')).toBe(true)
  })

  it('rejects identifiers starting with numbers', () => {
    expect(isValidIdentifier('123abc')).toBe(false)
  })

  it('rejects SQL injection attempts', () => {
    expect(isValidIdentifier("'; DROP TABLE--")).toBe(false)
    expect(isValidIdentifier('user; DELETE')).toBe(false)
  })

  it('rejects special characters', () => {
    expect(isValidIdentifier('user-name')).toBe(false)
    expect(isValidIdentifier('user.name')).toBe(false)
  })

  it('handles empty input', () => {
    expect(isValidIdentifier('')).toBe(false)
  })
})

describe('sanitizeIdentifier', () => {
  it('removes unsafe characters', () => {
    expect(sanitizeIdentifier('user-name')).toBe('username')
    expect(sanitizeIdentifier('table.column')).toBe('tablecolumn')
  })

  it('prefixes with underscore if starts with number', () => {
    expect(sanitizeIdentifier('123abc')).toBe('_123abc')
  })

  it('handles SQL injection strings', () => {
    expect(sanitizeIdentifier("'; DROP TABLE")).toBe('DROPTABLE')
  })
})

// ============================================
// JSON Parsing
// ============================================

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"name": "test"}', {})).toEqual({ name: 'test' })
  })

  it('returns default value for invalid JSON', () => {
    expect(safeJsonParse('invalid', { fallback: true })).toEqual({ fallback: true })
  })

  it('removes __proto__ key', () => {
    const result = safeJsonParse('{"__proto__": {"admin": true}, "name": "test"}', {})
    expect(result).not.toHaveProperty('__proto__')
    expect(result).toHaveProperty('name', 'test')
  })

  it('removes constructor key', () => {
    const result = safeJsonParse('{"constructor": {}, "data": 123}', {})
    expect(result).not.toHaveProperty('constructor')
    expect(result).toHaveProperty('data', 123)
  })

  it('handles nested prototype pollution', () => {
    const json = '{"nested": {"__proto__": {"polluted": true}}}'
    const result = safeJsonParse(json, {})
    expect((result as Record<string, Record<string, unknown>>).nested).not.toHaveProperty('__proto__')
  })
})

// ============================================
// String Escaping
// ============================================

describe('escapeHtml', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
    expect(escapeHtml("'single'")).toBe('&#x27;single&#x27;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('handles empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('preserves safe text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })
})

describe('escapeRegex', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegex('a.b*c?')).toBe('a\\.b\\*c\\?')
    expect(escapeRegex('[test]')).toBe('\\[test\\]')
    expect(escapeRegex('(group)')).toBe('\\(group\\)')
  })

  it('handles empty input', () => {
    expect(escapeRegex('')).toBe('')
  })
})

// ============================================
// String Normalization
// ============================================

describe('normalizeString', () => {
  it('trims whitespace', () => {
    expect(normalizeString('  hello  ')).toBe('hello')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeString('hello    world')).toBe('hello world')
  })

  it('handles mixed whitespace', () => {
    expect(normalizeString('  hello\t\nworld  ')).toBe('hello world')
  })

  it('handles empty input', () => {
    expect(normalizeString('')).toBe('')
  })
})

describe('normalizeEmail', () => {
  it('converts to lowercase', () => {
    expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
  })

  it('trims whitespace', () => {
    expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com')
  })

  it('handles empty input', () => {
    expect(normalizeEmail('')).toBe('')
  })
})
