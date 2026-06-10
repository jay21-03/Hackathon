package com.seal.hackathon.common.validation;

import com.seal.hackathon.common.util.RepositoryUrlValidation;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.util.StringUtils;

public class GitRepositoryUrlValidator implements ConstraintValidator<ValidGitRepositoryUrl, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        if (RepositoryUrlValidation.isValid(value)) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate("INVALID_REPOSITORY_URL").addConstraintViolation();
        return false;
    }
}
