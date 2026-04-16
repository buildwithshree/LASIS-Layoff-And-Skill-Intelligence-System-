package com.lasis.backend.security;

import com.lasis.backend.model.Role;
import com.lasis.backend.model.User;
import com.lasis.backend.repository.UserRepository;
import com.lasis.backend.service.JwtUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Instantiated directly to avoid circular dependency with SecurityConfig
    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email    = oAuth2User.getAttribute("email");
        String fullName = oAuth2User.getAttribute("name");

        if (email == null) {
            log.error("OAuth2: Google did not return an email address.");
            response.sendRedirect("http://localhost:5173/login?error=no_email");
            return;
        }

        // ── Find or create user ───────────────────────────────
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            log.info("OAuth2: existing user logged in via Google — {}", email);
        } else {
            // Auto-register as STUDENT — they will go through onboarding
            user = new User();
            user.setEmail(email);
            user.setFullName(fullName != null ? fullName : email);
            user.setRole(Role.STUDENT);
            // Random password — they will always use Google to log in
            user.setPassword(bCryptPasswordEncoder.encode(UUID.randomUUID().toString()));
            userRepository.save(user);
            log.info("OAuth2: new user auto-registered via Google — {}", email);
        }

        // ── Issue LASIS JWT ───────────────────────────────────
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        // ── Redirect to React callback with token + user info ─
        String redirectUrl = String.format(
            "http://localhost:5173/oauth2/callback?token=%s&email=%s&fullName=%s&role=%s",
            token,
            email,
            java.net.URLEncoder.encode(user.getFullName(), "UTF-8"),
            user.getRole().name()
        );

        log.info("OAuth2: redirecting to React callback for {}", email);
        response.sendRedirect(redirectUrl);
    }
}