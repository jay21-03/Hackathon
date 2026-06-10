package com.seal.hackathon.common.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PasswordPolicyValidatorTest {

    @Mock
    ConstraintValidatorContext context;

    @Mock
    ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    private final PasswordPolicyValidator validator = new PasswordPolicyValidator();

    @BeforeEach
    void setUp() {
        validator.initialize(null);
    }

    @Test
    void acceptsStrongPassword() {
        assertThat(validator.isValid("longpassword15chars", context)).isTrue();
        assertThat(validator.isValid("pass1234", context)).isTrue();
    }

    @Test
    void rejectsWeakPassword() {
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
        when(violationBuilder.addConstraintViolation()).thenReturn(context);
        assertThat(validator.isValid("short1", context)).isFalse();
    }

    @Test
    void blankDelegatesToNotBlank() {
        assertThat(validator.isValid("", context)).isTrue();
        assertThat(validator.isValid(null, context)).isTrue();
    }
}
