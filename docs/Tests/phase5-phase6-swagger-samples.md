# Phase 5-6 Swagger Test Samples

Use these JSON payloads in Swagger UI for manual testing of the implemented Phase 5 and Phase 6 APIs.

## Headers

Add the following header for protected endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Phase 5 - Problem Access & Runtime

### 1) Get Problem By Id

**Request**

```http
GET /api/v1/problems/101
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 101,
    "boardId": 55,
    "title": "Build a Voting Service",
    "description": "Implement the core voting workflow.",
    "attachmentUrl": "https://example.com/files/problem-101.pdf",
    "externalLink": "https://example.com/spec/problem-101",
    "releaseAt": "2026-06-03T09:00:00+07:00",
    "createdBy": 1,
    "createdAt": "2026-06-01T10:00:00+07:00",
    "updatedAt": "2026-06-01T10:00:00+07:00"
  }
}
```

### 2) List Problems By Board

**Request**

```http
GET /api/v1/boards/55/problems
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 101,
      "boardId": 55,
      "title": "Build a Voting Service",
      "description": "Implement the core voting workflow.",
      "attachmentUrl": "https://example.com/files/problem-101.pdf",
      "externalLink": "https://example.com/spec/problem-101",
      "releaseAt": "2026-06-03T09:00:00+07:00",
      "createdBy": 1,
      "createdAt": "2026-06-01T10:00:00+07:00",
      "updatedAt": "2026-06-01T10:00:00+07:00"
    }
  ]
}
```

### 3) Round Countdown

**Request**

```http
GET /api/v1/rounds/12/countdown
```

**Sample response when not started**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "status": "NOT_STARTED",
    "remainingSeconds": 3600
  }
}
```

**Sample response when running**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "status": "RUNNING",
    "remainingSeconds": 900
  }
}
```

**Sample response when ended**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "status": "ENDED",
    "remainingSeconds": 0
  }
}
```

## Phase 6 - Mentor / Judge Assignment

### 4) Assign Mentor To Board

**Request**

```http
POST /api/v1/boards/55/mentors
```

**Body**

```json
{
  "userId": 41
}
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 1,
    "boardId": 55,
    "assigneeId": 41,
    "createdAt": "2026-06-01T11:00:00+07:00",
    "createdBy": 1
  }
}
```

### 5) List My Mentor Assignments

**Request**

```http
GET /api/v1/mentors/assignments
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "boardId": 55,
      "assigneeId": 41,
      "createdAt": "2026-06-01T11:00:00+07:00",
      "createdBy": 1
    }
  ]
}
```

### 6) Delete Mentor Assignment

**Request**

```http
DELETE /api/v1/boards/55/mentors/41
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": "deleted"
}
```

### 7) Assign Judge To Board

**Request**

```http
POST /api/v1/boards/55/judges
```

**Body**

```json
{
  "userId": 52
}
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 2,
    "boardId": 55,
    "assigneeId": 52,
    "createdAt": "2026-06-01T11:05:00+07:00",
    "createdBy": 1
  }
}
```

### 8) List My Judge Assignments

**Request**

```http
GET /api/v1/judges/assignments
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 2,
      "boardId": 55,
      "assigneeId": 52,
      "createdAt": "2026-06-01T11:05:00+07:00",
      "createdBy": 1
    }
  ]
}
```

### 9) Delete Judge Assignment

**Request**

```http
DELETE /api/v1/boards/55/judges/52
```

**Sample response**

```json
{
  "success": true,
  "message": "OK",
  "data": "deleted"
}
```

## Common Error Samples

### Problem Not Released

```json
{
  "success": false,
  "message": "PROBLEM_NOT_RELEASED",
  "data": null
}
```

### Only Organizer Can Assign

```json
{
  "success": false,
  "message": "ONLY_ORGANIZER",
  "data": null
}
```

### Target User Has Wrong Role

```json
{
  "success": false,
  "message": "TARGET_NOT_MENTOR",
  "data": null
}
```

```json
{
  "success": false,
  "message": "TARGET_NOT_JUDGE",
  "data": null
}
```
