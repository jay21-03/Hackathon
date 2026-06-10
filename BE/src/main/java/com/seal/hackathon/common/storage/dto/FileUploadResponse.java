package com.seal.hackathon.common.storage.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileUploadResponse {
    private String url;
    private String fileName;
    private long size;
    private String mimeType;
}
