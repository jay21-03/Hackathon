package com.seal.hackathon.demo;

import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.demo.dto.DemoRegistrationSeedResponse;
import com.seal.hackathon.demo.dto.HistoricalDemoSeedResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class DemoSeedController {

    private final DemoSeedService demoSeedService;

    @PostMapping("/demo-seed/historical-data")
    public ApiResponse<HistoricalDemoSeedResponse> seedHistoricalData() {
        return ApiResponse.ok(demoSeedService.seedHistoricalData());
    }

    @PostMapping("/events/{eventId}/demo-seed/registrations")
    public ApiResponse<DemoRegistrationSeedResponse> seedRegistrations(@PathVariable Long eventId) {
        return ApiResponse.ok(demoSeedService.seedRegistrations(eventId));
    }
}
