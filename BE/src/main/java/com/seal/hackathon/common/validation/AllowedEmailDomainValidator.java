package com.seal.hackathon.common.validation;

import com.seal.hackathon.authprofile.security.EmailDomainPolicy;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.util.StringUtils;

public class AllowedEmailDomainValidator implements ConstraintValidator<AllowedEmailDomain, String> {

    private final EmailDomainPolicy emailDomainPolicy;

    public AllowedEmailDomainValidator(EmailDomainPolicy emailDomainPolicy) {
        this.emailDomainPolicy = emailDomainPolicy;
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        if (emailDomainPolicy.isAllowed(value)) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate("Email domain is not allowed").addConstraintViolation();
        return false;
    }
}
