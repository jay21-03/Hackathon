package com.seal.hackathon.aireview.client;

public interface AiReviewLlmClient {

    /** Returns raw JSON text from the model (expected to be valid JSON object). */
    String analyzeCodeDiff(String prompt);

    boolean isConfigured();
}
