package com.seal.hackathon.common.response;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    /** Stable machine-readable code for errors (e.g. TEAM_WAITLIST). */
    private String code;
    private T data;
    /** Field-level validation errors keyed by property name. */
    private Map<String, String> fieldErrors;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).message("OK").data(data).build();
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return ApiResponse.<T>builder().success(false).code(code).message(message).build();
    }

    public static ApiResponse<Void> validationFail(String message, Map<String, String> fieldErrors) {
        return ApiResponse.<Void>builder()
                .success(false)
                .code("VALIDATION_FAILED")
                .message(message)
                .fieldErrors(fieldErrors)
                .build();
    }
}
