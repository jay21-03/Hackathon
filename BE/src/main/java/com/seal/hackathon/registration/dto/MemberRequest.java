package com.seal.hackathon.registration.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MemberRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(max = 200, message = "fullName must not exceed 200 characters")
    private String fullName;

    @NotBlank
    @Size(max = 100, message = "studentId must not exceed 100 characters")
    private String studentId;

    @NotBlank
    @Size(max = 200, message = "university must not exceed 200 characters")
    private String university;

    public MemberRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }
}
