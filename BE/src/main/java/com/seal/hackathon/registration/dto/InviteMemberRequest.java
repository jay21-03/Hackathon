package com.seal.hackathon.registration.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Payload mời thành viên — chỉ cần email; MSSV/trường có thể bổ sung sau khi xác nhận. */
@Data
public class InviteMemberRequest {

    @NotBlank(message = "email must not be blank")
    @Email
    private String email;

    @Size(max = 200, message = "fullName must not exceed 200 characters")
    private String fullName;

    @Size(max = 100, message = "studentId must not exceed 100 characters")
    private String studentId;

    @Size(max = 200, message = "university must not exceed 200 characters")
    private String university;
}
