package com.seal.hackathon.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = GitRepositoryUrlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidGitRepositoryUrl {
    String message() default "INVALID_REPOSITORY_URL";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
