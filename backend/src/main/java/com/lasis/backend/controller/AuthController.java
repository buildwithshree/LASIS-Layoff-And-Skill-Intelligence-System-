package com.lasis.backend.controller;

import com.lasis.backend.dto.LoginRequestDTO;
import com.lasis.backend.dto.RegisterRequestDTO;
import com.lasis.backend.service.AuthService;
import com.lasis.backend.wrapper.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @Valid @RequestBody RegisterRequestDTO dto) {
        Map<String, Object> result = authService.register(dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "User registered successfully", result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody LoginRequestDTO dto) {
        Map<String, Object> result = authService.login(dto);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", result));
    }
}