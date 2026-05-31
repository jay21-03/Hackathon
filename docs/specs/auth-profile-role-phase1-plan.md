# Auth/Profile & Role Phase 1 Plan

## 1. Goal
- Implement Google OAuth/OIDC login thật.
- Verify Google identity token ở backend.
- Issue JWT cho client.
- Dùng JWT để gọi `GET /api/v1/me`, `PUT /api/v1/me/profile`, admin role APIs.
- Giữ mock/dev login là optional fallback cho local nếu thật sự cần.

## 2. Current Context
- Backend đang chạy ở port `8085`.
- PostgreSQL Docker đang dùng host port `5433`.
- `users` và `user_roles` đã có trong DB, không cần đổi schema nếu không thật sự cần.
- `UserStatus` và `SystemRole` enum đã có sẵn.
- Swagger chạy ở `http://localhost:8085/swagger-ui.html`.
- `ddl-auto: validate` đang bật, nên Phase 1 nên tránh Flyway/schema nếu không cần.
- `User` có cột `googleSub`, `email`, `fullName`, `avatarUrl`, `status`.
- `UserRepository` đã có `findByEmail`; `UserRoleRepository` đã có `findByUserId`.
- `SecurityConfig` hiện đang permit gần như toàn bộ request, nên Phase 1 phải siết lại cho JWT.
- Controller auth hiện là skeleton route cũ `/api/auth-profile/me`, nên plan này cần chốt route mới `/api/v1/me` và auth APIs mới.

## 3. API Scope

### Auth APIs
- `POST /api/v1/auth/google-login` - Must.
- `POST /api/v1/auth/logout` - Optional vì JWT stateless.
- `GET /api/v1/me` - Must.
- `PUT /api/v1/me/profile` - Must.
- `GET /api/v1/admin/users` - Must.
- `POST /api/v1/admin/users/{userId}/roles` - Must.
- `DELETE /api/v1/admin/users/{userId}/roles/{role}` - Should, để Phase sau nếu muốn.

> Không dùng `/api/v1/dev/login` làm flow chính nữa. Nếu giữ dev login thì chỉ là fallback local, phải bị khóa bằng `DEV_AUTH_ENABLED=true`, không dùng production, và không thay thế Google login.

## 4. Authentication Strategy
- Google login là flow chính.
- Backend nhận Google ID Token từ client, verify token, rồi issue JWT.
- Dev auth chỉ là fallback local nếu bật `DEV_AUTH_ENABLED=true`.
- Response chuẩn là `AuthResponse` gồm `accessToken`, `tokenType`, `expiresIn`, `currentUser`.

### 4.1 Google OAuth/OIDC Login Flow
- Frontend hoặc mobile app lấy Google ID Token bằng Google Sign-In / Google Identity Services.
- Client gửi ID Token đến backend qua `POST /api/v1/auth/google-login`.
- Backend verify token:
  - issuer hợp lệ.
  - audience khớp `GOOGLE_CLIENT_ID`.
  - email đã verified.
  - token chưa hết hạn.
  - email domain thuộc `ALLOWED_EMAIL_DOMAINS`.
- Backend lấy thông tin:
  - `google_sub`
  - `email`
  - `full_name`
  - `avatar_url`
- Nếu user chưa tồn tại:
  - tạo user mới `ACTIVE`.
  - set `google_sub`, `email`, `full_name`, `avatar_url`.
- Nếu user đã tồn tại:
  - cập nhật `google_sub`/`avatar`/`full_name` nếu cần.
- Backend load roles từ `user_roles`.
- Backend issue JWT.
- Response trả `accessToken`, `tokenType`, `expiresIn`, `currentUser`.

### 4.2 Dependency / Library Plan
- Google ID Token verification nên dùng Google official library, ví dụ `GoogleIdTokenVerifier` hoặc equivalent.
- Backend chỉ verify ID Token gửi từ frontend/mobile, không làm OAuth authorization code callback trong Phase 1.
- JWT nên dùng thư viện JWT rõ ràng, ví dụ `jjwt` hoặc library hiện có trong project.
- Không hard-code version nếu Spring Boot dependency management đã quản lý; nếu cần version thì ghi rõ vào implementation note.
- Không bật Spring OAuth2 client redirect flow nếu chưa dùng callback.

### 4.3 JWT Strategy
- Dùng header `Authorization: Bearer <accessToken>`.
- JWT chứa claims:
  - `sub` = user id.
  - `email` = user email.
  - `roles` = explicit roles từ `user_roles` + `PARTICIPANT` implicit.
  - `iat` = issued at.
  - `exp` = expiration.
- JWT algorithm: HS256 cho MVP.
- JWT secret lấy từ `JWT_SECRET`.
- JWT expiration lấy từ `JWT_EXPIRATION_MINUTES`.
- `JWT_SECRET` phải đủ dài, không dùng default yếu trong production.
- Nếu `JWT_SECRET` đang là default `change_me`, app local vẫn chạy nhưng production phải đổi.
- Không lưu access token vào DB trong Phase 1.
- Không làm refresh token trong Phase 1.
- Không làm blacklist/logout server-side trong Phase 1.
- Logout phía client chỉ cần xóa token.

### 4.4 JWT Authentication Filter
- Filter đọc `Authorization` Bearer token.
- Nếu token hợp lệ:
  - resolve user từ DB.
  - reject nếu user `DISABLED`.
  - set `Authentication`/`CurrentUser` vào `SecurityContext`.
- Nếu token thiếu hoặc sai ở protected endpoint:
  - trả `401`.
- Nếu authenticated nhưng thiếu role:
  - trả `403`.

### 4.5 Dev Auth Fallback
- Dev auth chỉ là optional fallback cho local.
- Nếu giữ fallback thì phải bật bằng `DEV_AUTH_ENABLED=true`.
- Không dùng production.
- Không thay thế Google login.

### 4.6 Organizer Bootstrap Strategy
- Cần có cách tạo Organizer đầu tiên để test admin role API.
- Config ưu tiên: `DEV_BOOTSTRAP_ORGANIZER_EMAIL` hoặc `APP_BOOTSTRAP_ORGANIZER_EMAIL`.
- Khi Google login thành công và email trùng bootstrap email thì user được đảm bảo có role `ORGANIZER`.
- Bootstrap phải idempotent, không tạo duplicate role.
- Không cho client tự gửi role để nâng quyền.

### 4.7 Domain Restriction
- Sau khi verify Google ID Token, backend phải kiểm tra email domain.
- Chỉ cho phép email thuộc danh sách domain được cấu hình.
- Nếu token hợp lệ nhưng email không thuộc domain cho phép thì trả `403`.
- Danh sách domain lấy từ `ALLOWED_EMAIL_DOMAINS`.
- Nếu danh sách rỗng trong local dev thì có thể cho phép mọi verified email, nhưng production phải cấu hình domain.
- Không chỉ dựa vào giao diện frontend để chặn domain; backend phải kiểm tra lại.

## 5. Authorization Strategy
- `PARTICIPANT` là implicit role cho mọi authenticated `ACTIVE` user.
- `ORGANIZER`, `MENTOR`, `JUDGE` nằm trong `user_roles`.
- `/api/v1/me` và `/api/v1/me/profile` cần JWT hợp lệ.
- `/api/v1/admin/**` cần `ORGANIZER`.
- Swagger public.
- Auth login endpoint public.
- `401` = chưa authenticated.
- `403` = authenticated nhưng thiếu quyền.
- Role check nên nằm trong `PermissionService` hoặc `RoleChecker`.

## 6. DTO Plan

### DTO dự kiến
- `GoogleLoginRequest`
- `AuthResponse`
- `CurrentUserResponse`
- `UpdateProfileRequest`
- `AssignRoleRequest`
- `UserSummaryResponse`

### Field gợi ý
`GoogleLoginRequest`:
- `idToken`

`AuthResponse`:
- `accessToken`
- `tokenType`
- `expiresIn`
- `user`

`CurrentUserResponse`:
- `id`
- `email`
- `fullName`
- `studentId`
- `university`
- `avatarUrl`
- `status`
- `roles`

`UpdateProfileRequest`:
- `fullName`
- `studentId`
- `university`
- `avatarUrl`

`AssignRoleRequest`:
- `role`

`UserSummaryResponse`:
- `id`
- `email`
- `fullName`
- `status`
- `roles`
- `createdAt`

### Response Format
- Dùng `ApiResponse` nếu project đã có.
- `CurrentUserResponse.roles` luôn bao gồm `PARTICIPANT` implicit.
- Explicit roles lấy từ `user_roles`.
- `AssignRoleRequest.role` chỉ nhận `ORGANIZER`, `MENTOR`, `JUDGE`.

## 7. Service Plan
- `AuthProfileService` hoặc `AuthService`:
  - `googleLogin(GoogleLoginRequest)`
  - `verifyGoogleIdToken(idToken)`
  - `findOrCreateGoogleUser(googlePayload)`
  - `issueJwt(user, roles)`
  - `getCurrentUser()`
  - `updateProfile()`
  - `listUsers()`
  - `assignRole()`
  - `removeRole()` optional
- `JwtService`:
  - `generateToken(user, roles)`
  - `validateToken(token)`
  - `parseClaims(token)`
- `PermissionService`:
  - `requireOrganizer()`
  - `hasRole()`
- `CurrentUserProvider`:
  - `getCurrentUser()`

## 8. Repository Usage
- Dùng repository hiện có trước:
  - `UserRepository.findByEmail`
  - `UserRepository.findByGoogleSub` nếu entity có `googleSub`
  - `UserRoleRepository.findByUserId`
  - `UserRoleRepository.existsByUserIdAndRole`
  - `UserRoleRepository.deleteByUserIdAndRole` nếu làm remove role
- Nếu cần `findByGoogleSub` thì có thể thêm vào plan vì `users.google_sub` đã có sẵn.
- Khi Google token trả email đã tồn tại nhưng `googleSub` null, update `googleSub`.
- Nếu `googleSub` đã tồn tại cho user khác thì phải reject để tránh account linking sai.
- Không đổi schema vì `users.google_sub` đã có trong DB.

## 9. Validation Rules
- `idToken` không rỗng.
- Google token phải valid.
- Google email phải verified.
- Email lowercase/trim.
- Email domain phải nằm trong `ALLOWED_EMAIL_DOMAINS`.
- Không chỉ dựa vào giao diện frontend để chặn domain; backend phải kiểm tra lại.
- User `DISABLED` không được login.
- `fullName` không rỗng khi update profile.
- Role chỉ nhận `ORGANIZER`, `MENTOR`, `JUDGE`.
- Không gán `PARTICIPANT` vào `user_roles`.
- Không gán trùng role.
- Bootstrap Organizer phải idempotent.

## 10. Security / Config Plan
- Public:
  - `/swagger-ui/**`
  - `/swagger-ui.html`
  - `/v3/api-docs/**`
  - `/api/v1/auth/google-login`
  - `OPTIONS /**`
- Protected:
  - `/api/v1/me`
  - `/api/v1/me/profile`
- Organizer-only:
  - `/api/v1/admin/**`
- Config/env:
  - `GOOGLE_CLIENT_ID`
  - `JWT_SECRET`
  - `JWT_EXPIRATION_MINUTES`
  - `APP_BOOTSTRAP_ORGANIZER_EMAIL` hoặc `DEV_BOOTSTRAP_ORGANIZER_EMAIL`
  - `ALLOWED_EMAIL_DOMAINS=fpt.edu.vn,fe.edu.vn`
  - `DEV_AUTH_ENABLED=false` mặc định nếu vẫn giữ dev auth fallback
  - `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- Không bật Google OAuth client auto-config nếu client-secret/callback chưa dùng.
- Ưu tiên backend verify Google ID Token từ request body để phù hợp web/mobile MVP.
- Cần cấu hình OpenAPI/Swagger Bearer JWT security scheme để Swagger có nút Authorize.
- Swagger public nhưng các protected endpoints vẫn yêu cầu Bearer token khi Execute.
- `GOOGLE_CLIENT_ID` dùng để verify audience.
- `ALLOWED_EMAIL_DOMAINS` dùng để giới hạn Google EDU/school domain.
- Optional: nếu Google token có hosted domain claim thì có thể dùng để tham khảo, nhưng backend vẫn nên kiểm tra email domain.

### 10.1 CORS Plan
- Cho phép frontend local gọi backend:
  - origin: `http://localhost:5173`
  - headers: `Authorization`, `Content-Type`
  - methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Không mở wildcard production nếu không cần.
- CORS config không được chặn Swagger.

## 11. Swagger Test Plan
- Swagger Authorize dùng Bearer JWT.
- Sau khi login thành công, copy `accessToken` vào Authorization.
- `POST /api/v1/auth/google-login` thiếu `idToken` => `400`.
- `POST /api/v1/auth/google-login` với `idToken` không hợp lệ => `401`.
- `POST /api/v1/auth/google-login` với `idToken` hợp lệ => `200` + JWT.
- Google token hợp lệ + email domain cho phép => `200` + JWT.
- Google token hợp lệ + email domain không cho phép => `403`.
- Google token thiếu `email_verified` hoặc `email_verified=false` => `401/403` theo convention.
- `GET /api/v1/me` không token => `401`.
- `GET /api/v1/me` token hợp lệ => `200`.
- `PUT /api/v1/me/profile` token hợp lệ => `200`.
- `GET /api/v1/admin/users` với participant token => `403`.
- Login bằng bootstrap organizer email => user có `ORGANIZER`.
- `GET /api/v1/admin/users` với organizer token => `200`.
- `POST /api/v1/admin/users/{userId}/roles` với role `MENTOR` cho user khác => `200`.
- Assign role trùng => không duplicate.
- Nếu không có token thật, test compile/security path trước.

## 11.1 Test Strategy Without Real Google Token
- Khi chưa có frontend Google Sign-In, vẫn test được:
  - compile.
  - run-dev.
  - Swagger public/protected path.
  - JWT filter bằng token do `JwtService` sinh trong test nếu có test helper.
- Google token verification thật cần ID Token thật từ frontend/mobile hoặc Google Sign-In tool.
- Không fake Google token trong production login path.
- Có thể mock `GoogleTokenVerifier` trong unit/integration test sau này.

## 12. Acceptance Criteria
- Backend compile pass.
- `run-dev.ps1` start pass.
- Swagger load được.
- `POST /api/v1/auth/google-login` tồn tại.
- Backend verify Google token và issue JWT.
- `GET /api/v1/me` dùng Bearer JWT.
- `PUT /api/v1/me/profile` dùng Bearer JWT.
- Admin API thiếu token => `401`.
- Admin API thiếu `ORGANIZER` => `403`.
- Bootstrap Organizer hoạt động.
- JWT claim format được chốt rõ.
- CORS local frontend hoạt động.
- Google ID Token verify strategy rõ.
- `GOOGLE_CLIENT_SECRET` không bắt buộc cho ID token verification.
- Backend chỉ issue JWT cho Google account có verified email thuộc allowed domain.
- Domain restriction được cấu hình bằng env, không hard-code trong code.
- Bootstrap Organizer không tạo duplicate role.
- Role assignment hoạt động.
- Không đổi schema/Flyway nếu không cần.
- Không làm Team Registration/Contest/Scoring.

## 13. Risks
- Mock/dev auth fallback có thể làm mơ hồ nếu không khóa bằng `DEV_AUTH_ENABLED`.
- Google token verification phải chặt, nếu sai `aud`/`iss` có thể mở lỗ hổng đăng nhập.
- Nếu `JWT_SECRET` yếu hoặc lộ, toàn bộ auth bị ảnh hưởng.
- Nếu security filter quá chặt thì Swagger có thể không mở được.
- Nếu không có user seed/bootstrap email thì admin test sẽ khó khởi tạo Organizer đầu tiên.

## 14. Non-goals
- Không làm OAuth authorization-code callback flow.
- Không làm refresh token, bao gồm Google refresh token.
- Không lưu Google access token.
- Không lưu JWT vào database.
- Không làm password login.
- Không làm session login.
- Không làm remember-me.
- Không làm frontend Google login UI.
- Không làm Team Registration.
- Không làm Contest Management.
- Không làm Scoring/Ranking.
- Không làm AI Review thật.

## 15. Implementation Order Proposal
1. DTO.
2. Google token verification and JWT service.
3. `CurrentUser` model/provider.
4. JWT authentication filter.
5. `AuthProfileService`.
6. `AuthProfileController`.
7. Admin role endpoints.
8. Security config.
9. Swagger/manual test.
10. Commit.
