package com.seal.hackathon.contest.controller;

import com.seal.hackathon.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @GetMapping
    public ApiResponse<String> getEvents() {
        return ApiResponse.ok("Event API skeleton");
    }
}
