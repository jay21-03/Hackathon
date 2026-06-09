package com.seal.hackathon.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;

public final class OutboxPayloadBuilder {

    private OutboxPayloadBuilder() {}

    public static String invitationSent(ObjectMapper objectMapper, Map<String, Object> fields) {
        try {
            return objectMapper.writeValueAsString(new LinkedHashMap<>(fields));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize outbox payload", ex);
        }
    }
}
