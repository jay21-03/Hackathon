package com.seal.hackathon.github.webhook;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks/github")
@RequiredArgsConstructor
public class GitHubWebhookController {

    private final GitHubWebhookService githubWebhookService;

    @PostMapping
    public ResponseEntity<Void> handleGitHubWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-GitHub-Event", required = false) String eventType,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature) {
        githubWebhookService.handleWebhook(eventType, payload, signature);
        return ResponseEntity.ok().build();
    }
}
