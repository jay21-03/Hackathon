package com.seal.hackathon.demo;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.demo.seed")
public class DemoSeedProperties {
    private boolean enabled = false;
    private String defaultPassword = "Ph@050204";
}
