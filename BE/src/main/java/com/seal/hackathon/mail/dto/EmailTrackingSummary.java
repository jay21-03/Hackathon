package com.seal.hackathon.mail.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailTrackingSummary {

    private Integer openCount;
    private OffsetDateTime openedAt;
    private OffsetDateTime acceptClickedAt;
    private OffsetDateTime declineClickedAt;
    private OffsetDateTime sentAt;
}
