package com.seal.hackathon.common.exception;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.common.util.DataIntegrityViolationResolver;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.PersistenceException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getMessage(), request, null);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION", "CONCURRENT_MODIFICATION", request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = collectFieldErrors(ex);
        String message = fieldErrors.isEmpty()
                ? "Validation failed"
                : fieldErrors.values().stream().collect(Collectors.joining("; "));
        return problemOrApi(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", message, request, fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.BAD_REQUEST, "Invalid request body", "Invalid request body", request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        String code = DataIntegrityViolationResolver.resolveMessage(ex);
        return problemOrApi(HttpStatus.CONFLICT, code, code, request, null);
    }

    @ExceptionHandler(PersistenceException.class)
    public ResponseEntity<?> handlePersistenceException(PersistenceException ex, HttpServletRequest request) {
        if (ex.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
            String code = DataIntegrityViolationResolver.resolveMessage(
                    new DataIntegrityViolationException(ex.getMessage(), ex));
            return problemOrApi(HttpStatus.CONFLICT, code, code, request, null);
        }
        log.error("Persistence failure", ex);
        return problemOrApi(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "Internal server error", request, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.NOT_FOUND, "Not found", "Not found", request, null);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatusException(ResponseStatusException ex, HttpServletRequest request) {
        String message = ex.getReason() == null ? ex.getStatusCode().toString() : ex.getReason();
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return problemOrApi(status, message, message, request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return problemOrApi(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "Internal server error", request, null);
    }

    private Map<String, String> collectFieldErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        for (ObjectError objectError : ex.getBindingResult().getGlobalErrors()) {
            String key = objectError.getObjectName() + "." + objectError.getCode();
            fieldErrors.putIfAbsent(key, objectError.getDefaultMessage());
        }
        return fieldErrors;
    }

    private ResponseEntity<?> problemOrApi(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors) {
        if (acceptsProblemJson(request)) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, message);
            problem.setTitle(status.toString());
            problem.setProperty("code", code);
            if (fieldErrors != null && !fieldErrors.isEmpty()) {
                problem.setProperty("fieldErrors", fieldErrors);
            }
            return ResponseEntity.status(status).body(problem);
        }
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            return ResponseEntity.status(status).body(ApiResponse.validationFail(message, fieldErrors));
        }
        return ResponseEntity.status(status).body(ApiResponse.fail(code, message));
    }

    private boolean acceptsProblemJson(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains("application/problem+json");
    }
}
