package com.seal.hackathon.github.client;

import lombok.Getter;

@Getter
public class GitHubClientException extends RuntimeException {
    private final int statusCode;
    private final String responseBody;

    public GitHubClientException(int statusCode, String message) {
        this(statusCode, message, null);
    }

    public GitHubClientException(int statusCode, String message, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}
