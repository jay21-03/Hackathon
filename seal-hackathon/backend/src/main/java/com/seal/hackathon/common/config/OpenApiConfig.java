package com.seal.hackathon.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI sealOpenApi() {
        return new OpenAPI().info(new Info()
                .title("SEAL Hackathon Management API")
                .version("v0.1.0")
                .description("Skeleton API for MVP setup"));
    }
}
