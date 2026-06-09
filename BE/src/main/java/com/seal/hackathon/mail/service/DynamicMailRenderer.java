package com.seal.hackathon.mail.service;

import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class DynamicMailRenderer {

    private final TemplateEngine inlineMailTemplateEngine;
    private final TemplateEngine classpathTemplateEngine;

    public DynamicMailRenderer(
            @Qualifier("inlineMailTemplateEngine") TemplateEngine inlineMailTemplateEngine,
            TemplateEngine classpathTemplateEngine) {
        this.inlineMailTemplateEngine = inlineMailTemplateEngine;
        this.classpathTemplateEngine = classpathTemplateEngine;
    }

    public String renderInline(String templateHtml, Map<String, Object> variables) {
        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        variables.forEach(context::setVariable);
        return inlineMailTemplateEngine.process(templateHtml, context);
    }

    public String renderClasspath(String templateName, Map<String, Object> variables) {
        Context context = new Context(Locale.forLanguageTag("vi-VN"));
        variables.forEach(context::setVariable);
        return classpathTemplateEngine.process(templateName, context);
    }
}
