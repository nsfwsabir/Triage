package com.triage.service;

import com.triage.dto.TicketDetailResponse;
import com.triage.dto.TicketPatchRequest;
import com.triage.dto.TicketRequest;
import com.triage.dto.TicketResponse;
import com.triage.dto.TicketStatsResponse;
import com.triage.entity.Role;
import com.triage.entity.Ticket;
import com.triage.entity.TicketComment;
import com.triage.entity.TicketStatus;
import com.triage.entity.TicketPriority;
import com.triage.entity.User;
import com.triage.exception.InvalidStateTransitionException;
import com.triage.exception.ResourceNotFoundException;
import com.triage.repository.TicketCommentRepository;
import com.triage.repository.TicketRepository;
import com.triage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class TicketService {

    private static final Map<TicketStatus, Set<TicketStatus>> TRANSITIONS = Map.of(
            TicketStatus.OPEN, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.CLOSED),
            TicketStatus.IN_PROGRESS, Set.of(TicketStatus.RESOLVED, TicketStatus.OPEN),
            TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED, TicketStatus.IN_PROGRESS),
            TicketStatus.CLOSED, Set.of(TicketStatus.OPEN));

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository, TicketCommentRepository commentRepository,
                         UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> list(TicketStatus status, TicketPriority priority,
                                     com.triage.entity.TicketCategory category, String search, User current) {
        List<Ticket> scoped = current.getRole() == Role.ADMIN
                ? ticketRepository.findAllByOrderByCreatedAtDesc()
                : ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(current.getId());

        return scoped.stream()
                .filter(t -> status == null || t.getStatus() == status)
                .filter(t -> priority == null || t.getPriority() == priority)
                .filter(t -> category == null || t.getCategory() == category)
                .filter(t -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase(Locale.ROOT);
                    return t.getTitle().toLowerCase(Locale.ROOT).contains(q)
                            || t.getDescription().toLowerCase(Locale.ROOT).contains(q);
                })
                .map(TicketResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketStatsResponse stats(User current) {
        List<Ticket> scoped = current.getRole() == Role.ADMIN
                ? ticketRepository.findAllByOrderByCreatedAtDesc()
                : ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(current.getId());

        long high = scoped.stream().filter(t -> t.getPriority() == TicketPriority.HIGH
                || t.getPriority() == TicketPriority.CRITICAL).count();

        return new TicketStatsResponse(
                scoped.size(),
                countStatus(scoped, TicketStatus.OPEN),
                countStatus(scoped, TicketStatus.IN_PROGRESS),
                countStatus(scoped, TicketStatus.RESOLVED),
                high);
    }

    private long countStatus(List<Ticket> tickets, TicketStatus status) {
        return tickets.stream().filter(t -> t.getStatus() == status).count();
    }

    @Transactional
    public TicketResponse create(TicketRequest request, User current) {
        Ticket ticket = new Ticket();
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedBy(current);
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    @Transactional(readOnly = true)
    public TicketDetailResponse getDetail(Long id, User current) {
        Ticket ticket = findOwned(id, current);
        List<TicketDetailResponse.CommentResponse> comments = commentRepository
                .findByTicketIdOrderByCreatedAtAsc(id).stream()
                .map(TicketDetailResponse.CommentResponse::from)
                .toList();
        return TicketDetailResponse.from(ticket, comments);
    }

    @Transactional
    public TicketResponse patch(Long id, TicketPatchRequest request, User current) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        boolean isAdmin = current.getRole() == Role.ADMIN;
        if (!isAdmin) {
            // A USER may only close their own ticket, and only while it is RESOLVED
            if (!ticket.getCreatedBy().getId().equals(current.getId())
                    || request.status() != TicketStatus.CLOSED
                    || request.priority() != null || request.assignedToId() != null
                    || ticket.getStatus() != TicketStatus.RESOLVED) {
                throw new AccessDeniedException("USER cannot modify this ticket");
            }
        }

        if (request.status() != null) {
            validateTransition(ticket.getStatus(), request.status(), isAdmin);
            ticket.setStatus(request.status());
        }
        if (request.priority() != null) {
            ticket.setPriority(request.priority());
        }
        if (request.assignedToId() != null) {
            User assignee = userRepository.findById(request.assignedToId())
                    .filter(u -> u.getRole() == Role.ADMIN)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "assignedToId must reference an existing ADMIN user"));
            ticket.setAssignedTo(assignee);
        }

        // resolved_at bookkeeping
        if (request.status() == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (request.status() == TicketStatus.OPEN || request.status() == TicketStatus.IN_PROGRESS) {
            ticket.setResolvedAt(null);
        }

        return TicketResponse.from(ticketRepository.save(ticket));
    }

    private void validateTransition(TicketStatus from, TicketStatus to, boolean isAdmin) {
        if (from == to) {
            return;
        }
        Set<TicketStatus> allowed = TRANSITIONS.get(from);
        if (!allowed.contains(to)) {
            throw new InvalidStateTransitionException("Invalid transition: " + from + " -> " + to);
        }
        if (from == TicketStatus.CLOSED && !isAdmin) {
            throw new AccessDeniedException("Only ADMIN can reopen a CLOSED ticket");
        }
    }

    @Transactional
    public void delete(Long id, User current) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        boolean owner = ticket.getCreatedBy().getId().equals(current.getId());
        boolean allowed = current.getRole() == Role.ADMIN || (owner && ticket.getStatus() == TicketStatus.OPEN);
        if (!allowed) {
            throw new AccessDeniedException("Ticket can only be deleted by ADMIN or its owner while OPEN");
        }
        ticketRepository.delete(ticket);
    }

    @Transactional
    public TicketDetailResponse.CommentResponse addComment(Long ticketId, String content, User current) {
        Ticket ticket = findOwned(ticketId, current);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthor(current);
        comment.setContent(content);
        return TicketDetailResponse.CommentResponse.from(commentRepository.save(comment));
    }

    private Ticket findOwned(Long id, User current) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (current.getRole() != Role.ADMIN && !ticket.getCreatedBy().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not have access to this ticket");
        }
        return ticket;
    }
}
