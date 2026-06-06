package com.seal.hackathon.notification.dto;

import com.seal.hackathon.common.enums.AnnouncementAudience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAnnouncementRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    private String content;

    /** Gửi ngay; mặc định true. false = lưu nháp (chưa fan-out). */
    private Boolean publishNow = true;

    /** ALL | PARTICIPANTS | STAFF — mặc định ALL */
    private AnnouncementAudience audience = AnnouncementAudience.ALL;
}
