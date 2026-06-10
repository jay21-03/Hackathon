package com.seal.hackathon.common.html;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ProblemHtmlSanitizerTest {

    private final ProblemHtmlSanitizer sanitizer = new ProblemHtmlSanitizer();

    @Test
    void stripsScriptTags() {
        String result = sanitizer.sanitize("<p>Hello</p><script>alert(1)</script>");
        assertNotNull(result);
        assertTrue(result.contains("Hello"));
        assertFalse(result.toLowerCase().contains("script"));
    }

    @Test
    void keepsAllowedFormatting() {
        String input = "<h2>Đề</h2><p><strong>Q1</strong></p><ul><li>A</li></ul>";
        String result = sanitizer.sanitize(input);
        assertNotNull(result);
        assertTrue(result.contains("<h2>"));
        assertTrue(result.contains("<strong>"));
        assertTrue(result.contains("<ul>"));
    }

    @Test
    void blankInputReturnsNull() {
        assertNull(sanitizer.sanitize(null));
        assertNull(sanitizer.sanitize("   "));
    }
}
