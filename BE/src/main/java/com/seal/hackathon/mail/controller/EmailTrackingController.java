package com.seal.hackathon.mail.controller;

import com.seal.hackathon.mail.service.EmailTrackingService;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/email-tracking")
@RequiredArgsConstructor
public class EmailTrackingController {

    private final EmailTrackingService emailTrackingService;

    @GetMapping("/{token}/open.gif")
    public ResponseEntity<byte[]> trackOpen(@PathVariable String token) {
        byte[] gif = emailTrackingService.recordOpen(token);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_GIF)
                .cacheControl(CacheControl.noStore())
                .body(gif);
    }

    @GetMapping("/{token}/click")
    public ResponseEntity<Void> trackClick(@PathVariable String token, @RequestParam String action) {
        String redirectUrl = emailTrackingService.recordClickAndRedirect(token, action);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(redirectUrl));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
