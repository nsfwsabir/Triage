package com.triage.controller;

import com.triage.dto.UserResponse;
import com.triage.entity.Role;
import com.triage.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> admins() {
        return userRepository.findByRole(Role.ADMIN).stream().map(UserResponse::from).toList();
    }
}
