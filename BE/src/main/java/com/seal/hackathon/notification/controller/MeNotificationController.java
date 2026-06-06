package com.seal.hackathon.notification.controller;



import com.seal.hackathon.common.enums.NotificationType;
import com.seal.hackathon.common.response.ApiResponse;

import com.seal.hackathon.notification.dto.NotificationListResponse;

import com.seal.hackathon.notification.dto.NotificationResponse;

import com.seal.hackathon.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.PutMapping;

import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.RequestParam;

import org.springframework.web.bind.annotation.RestController;



@RestController

@RequestMapping("/api/v1/me/notifications")

@RequiredArgsConstructor

@SecurityRequirement(name = "bearerAuth")

public class MeNotificationController {



    private final NotificationService notificationService;



    @GetMapping

    public ApiResponse<NotificationListResponse> listMyNotifications(

            @RequestParam(required = false) Integer page,

            @RequestParam(required = false) Integer size,

            @RequestParam(required = false) NotificationType type) {

        return ApiResponse.ok(notificationService.listForCurrentUser(page, size, type));

    }



    @GetMapping("/unread-count")

    public ApiResponse<Long> unreadCount() {

        return ApiResponse.ok(notificationService.unreadCountForCurrentUser());

    }



    @PutMapping("/{notificationId}/read")

    public ApiResponse<NotificationResponse> markRead(@PathVariable Long notificationId) {

        return ApiResponse.ok(notificationService.markRead(notificationId));

    }



    @PutMapping("/read-all")

    public ApiResponse<NotificationListResponse> markAllRead() {

        return ApiResponse.ok(notificationService.markAllRead());

    }

}

