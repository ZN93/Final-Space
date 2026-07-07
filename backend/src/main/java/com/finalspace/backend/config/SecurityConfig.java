package com.finalspace.backend.config;

import com.finalspace.backend.security.JwtAuthenticationFilter;
import com.finalspace.backend.security.RestAuthenticationEntryPoint;
import com.finalspace.backend.security.RestAccessDeniedHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private static final String[] OPERATIONAL_RESOURCES = {
            "/api/missions",
            "/api/missions/**",
            "/api/satellites",
            "/api/satellites/**",
            "/api/simulations",
            "/api/simulations/**",
            "/api/telemetry",
            "/api/telemetry/**",
            "/api/alerts",
            "/api/alerts/**",
            "/api/incidents",
            "/api/incidents/**",
            "/api/reports",
            "/api/reports/**"
    };

    @Value("${cors.allowed-origins:http://localhost:4200,http://localhost}")
    private String corsAllowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login").permitAll()

                        .requestMatchers("/api/users", "/api/users/**")
                        .hasAuthority("ROLE_ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/dashboard", "/api/dashboard/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERATEUR", "ROLE_LECTEUR")

                        .requestMatchers(HttpMethod.GET, OPERATIONAL_RESOURCES)
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERATEUR", "ROLE_LECTEUR")

                        .requestMatchers(HttpMethod.POST, OPERATIONAL_RESOURCES)
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERATEUR")

                        .requestMatchers(HttpMethod.PUT, OPERATIONAL_RESOURCES)
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERATEUR")

                        .requestMatchers(HttpMethod.PATCH, OPERATIONAL_RESOURCES)
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERATEUR")

                        .requestMatchers(HttpMethod.DELETE, OPERATIONAL_RESOURCES)
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERATEUR")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();

        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(List.of("Content-Disposition"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}