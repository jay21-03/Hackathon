package com.seal.hackathon.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seal.hackathon.authprofile.security.JwtAuthenticationFilter;
import com.seal.hackathon.common.response.ApiResponse;
import com.seal.hackathon.common.security.RateLimitFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;
    private final ObjectMapper objectMapper;
    private final String corsAllowedOrigins;
    private final boolean apiDocsEnabled;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RateLimitFilter rateLimitFilter,
            ObjectMapper objectMapper,
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String corsAllowedOrigins,
            @Value("${springdoc.api-docs.enabled:true}") boolean apiDocsEnabled) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.objectMapper = objectMapper;
        this.corsAllowedOrigins = corsAllowedOrigins;
        this.apiDocsEnabled = apiDocsEnabled;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) ->
                        writeError(response, HttpStatus.UNAUTHORIZED, "Unauthorized"))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                        writeError(response, HttpStatus.FORBIDDEN, "Forbidden")))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();
                if (apiDocsEnabled) {
                    auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll();
                }
                auth.requestMatchers(
                        "/api/v1/auth/google-login",
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/forgot-password",
                        "/api/v1/auth/reset-password")
                .permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/rounds").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/results").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/awards").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/*/announcements").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/rounds/*/countdown").permitAll()
                .requestMatchers("/api/v1/public/email-tracking/**").permitAll()
                .requestMatchers("/api/v1/staff-invitations/decline").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/webhooks/github").permitAll()
                .requestMatchers("/ws/commits", "/ws/commits/**").permitAll()
                .requestMatchers("/api/v1/webhooks/n8n/ai-review/**").permitAll()
                .requestMatchers("/api/v1/team-invitations/confirm", "/api/v1/team-invitations/decline").authenticated()
                .requestMatchers("/api/v1/staff-invitations/accept").authenticated()
                .requestMatchers("/api/v1/admin/**").hasRole("ORGANIZER")
                .requestMatchers("/api/v1/my/**").authenticated()
                .requestMatchers("/api/v1/me", "/api/v1/me/**").authenticated()
                .requestMatchers("/api/v1/judge/**").hasRole("JUDGE")
                .anyRequest().authenticated();
            })
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(parseAllowedOrigins(corsAllowedOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> parseAllowedOrigins(String rawOrigins) {
        if (rawOrigins == null || rawOrigins.isBlank()) {
            return List.of("http://localhost:5173");
        }
        return Arrays.stream(rawOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toList());
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<Void> body = ApiResponse.<Void>builder()
                .success(false)
                .message(message)
                .build();
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
