package com.seal.hackathon.common.validation;

import com.seal.hackathon.authprofile.security.AuthCredentialPolicy;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

public class PasswordPolicyValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        try {
            AuthCredentialPolicy.assertPassword(value);
            return true;
        } catch (ResponseStatusException ex) {
            String reason = ex.getReason();
            if (!StringUtils.hasText(reason)) {
                reason = "PASSWORD_WEAK";
            }
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(reason).addConstraintViolation();
            return false;
        }
    }
}
