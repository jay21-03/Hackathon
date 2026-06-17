package com.seal.hackathon.authprofile.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.seal.hackathon.common.enums.StudentType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.regex.Pattern;
import lombok.Data;
import org.springframework.util.StringUtils;

@Data
public class UpdateProfileRequest {

    private static final Pattern GITHUB_USERNAME_PATTERN =
            Pattern.compile("^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$");

    @NotBlank(message = "fullName must not be blank")
    @Size(max = 200, message = "fullName must not exceed 200 characters")
    private String fullName;

    private StudentType studentType;

    @Size(max = 100, message = "studentId must not exceed 100 characters")
    private String studentId;

    @Size(max = 200, message = "university must not exceed 200 characters")
    private String university;

    @Size(max = 2048, message = "avatarUrl must not exceed 2048 characters")
    private String avatarUrl;

    private String githubUsername;

    @AssertTrue(message = "UNIVERSITY_REQUIRED_FOR_EXTERNAL")
    @JsonIgnore
    public boolean isUniversityValidForStudentType() {
        if (studentType != StudentType.EXTERNAL) {
            return true;
        }
        return StringUtils.hasText(university);
    }

    @AssertTrue(message = "USERNAME_INVALID")
    @JsonIgnore
    public boolean isGithubUsernameValid() {
        if (!StringUtils.hasText(githubUsername)) {
            return true;
        }
        String normalized = githubUsername.trim();
        if (normalized.length() < 3 || normalized.length() > 39) {
            return false;
        }
        return GITHUB_USERNAME_PATTERN.matcher(normalized).matches();
    }
}
