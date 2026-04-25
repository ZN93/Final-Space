package com.finalspace.backend.config;

import com.finalspace.backend.user.RoleType;
import com.finalspace.backend.user.User;
import com.finalspace.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner init() {
        return args -> {
            createUserIfNotExists("admin@finalspace.com", "admin123", RoleType.ADMIN);
            createUserIfNotExists("operator@finalspace.com", "operator123", RoleType.OPERATEUR);
            createUserIfNotExists("reader@finalspace.com", "reader123", RoleType.LECTEUR);
        };
    }

    private void createUserIfNotExists(String email, String password, RoleType role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(role)
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            userRepository.save(user);
        }
    }
}