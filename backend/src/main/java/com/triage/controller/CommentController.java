package com.triage.controller;

import com.triage.config.CurrentUser;
import com.triage.dto.TicketDetailResponse;
import com.triage.entity.User;
import com.triage.service.TicketService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
public class CommentController {

    private final TicketService ticketService;

    public CommentController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    public record CommentRequest(@NotBlank String content) {
    }

    @PostMapping
    public ResponseEntity<TicketDetailResponse.CommentResponse> addComment(
            @PathVariable Long ticketId, @RequestBody CommentRequest request, @CurrentUser User current) {
        TicketDetailResponse.CommentResponse comment = ticketService.addComment(ticketId, request.content(), current);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }
}
