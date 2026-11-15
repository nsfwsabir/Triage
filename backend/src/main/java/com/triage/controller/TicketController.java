package com.triage.controller;

import com.triage.config.CurrentUser;
import com.triage.dto.TicketDetailResponse;
import com.triage.dto.TicketPatchRequest;
import com.triage.dto.TicketRequest;
import com.triage.dto.TicketResponse;
import com.triage.dto.TicketStatsResponse;
import com.triage.entity.TicketCategory;
import com.triage.entity.TicketPriority;
import com.triage.entity.TicketStatus;
import com.triage.entity.User;
import com.triage.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping
    public List<TicketResponse> list(@RequestParam(required = false) TicketStatus status,
                                     @RequestParam(required = false) TicketPriority priority,
                                     @RequestParam(required = false) TicketCategory category,
                                     @RequestParam(required = false) String search,
                                     @CurrentUser User current) {
        return ticketService.list(status, priority, category, search, current);
    }

    @GetMapping("/stats")
    public TicketStatsResponse stats(@CurrentUser User current) {
        return ticketService.stats(current);
    }

    @PostMapping
    public ResponseEntity<TicketResponse> create(@Valid @RequestBody TicketRequest request,
                                                 @CurrentUser User current) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request, current));
    }

    @GetMapping("/{id}")
    public TicketDetailResponse get(@PathVariable Long id, @CurrentUser User current) {
        return ticketService.getDetail(id, current);
    }

    @PatchMapping("/{id}")
    public TicketResponse patch(@PathVariable Long id, @RequestBody TicketPatchRequest request,
                                @CurrentUser User current) {
        return ticketService.patch(id, request, current);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @CurrentUser User current) {
        ticketService.delete(id, current);
        return ResponseEntity.noContent().build();
    }
}
