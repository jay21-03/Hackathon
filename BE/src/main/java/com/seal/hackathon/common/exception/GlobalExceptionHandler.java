package com.seal.hackathon.common.exception;

import com.seal.hackathon.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.PersistenceException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
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
        return problemOrApi(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getMessage(), request);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION", "CONCURRENT_MODIFICATION", request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Validation failed");
        return problemOrApi(HttpStatus.BAD_REQUEST, message, message, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.BAD_REQUEST, "Invalid request body", "Invalid request body", request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", "DATA_INTEGRITY_VIOLATION", request);
    }

    @ExceptionHandler(PersistenceException.class)
    public ResponseEntity<?> handlePersistenceException(PersistenceException ex, HttpServletRequest request) {
        if (ex.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
            return problemOrApi(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", "DATA_INTEGRITY_VIOLATION", request);
        }
        log.error("Persistence failure", ex);
        return problemOrApi(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "Internal server error", request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        return problemOrApi(HttpStatus.NOT_FOUND, "Not found", "Not found", request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatusException(ResponseStatusException ex, HttpServletRequest request) {
        String message = ex.getReason() == null ? ex.getStatusCode().toString() : ex.getReason();
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return problemOrApi(status, message, message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return problemOrApi(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "Internal server error", request);
    }

    private ResponseEntity<?> problemOrApi(
            HttpStatus status, String code, String message, HttpServletRequest request) {
        if (acceptsProblemJson(request)) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, message);
            problem.setTitle(status.toString());
            problem.setProperty("code", code);
            return ResponseEntity.status(status).body(problem);
        }
        return ResponseEntity.status(status).body(ApiResponse.fail(code, message));
    }

    private boolean acceptsProblemJson(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains("application/problem+json");
    }
}
