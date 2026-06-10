package com.seal.hackathon.common.html;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ProblemHtmlSanitizer {

    private final PolicyFactory policy = new HtmlPolicyBuilder()
            .allowElements(
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "p",
                    "ul",
                    "ol",
                    "li",
                    "strong",
                    "em",
                    "u",
                    "a",
                    "table",
                    "thead",
                    "tbody",
                    "tr",
                    "th",
                    "td",
                    "code",
                    "pre",
                    "br",
                    "blockquote",
                    "hr")
            .allowAttributes("href", "target", "rel")
            .onElements("a")
            .allowAttributes("colspan", "rowspan")
            .onElements("th", "td")
            .allowStandardUrlProtocols()
            .requireRelNofollowOnLinks()
            .toFactory();

    public String sanitize(String html) {
        if (!StringUtils.hasText(html)) {
            return null;
        }
        String sanitized = policy.sanitize(html.trim());
        return StringUtils.hasText(sanitized) ? sanitized : null;
    }
}
