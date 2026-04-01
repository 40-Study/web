# Phase 4: Seed Rich Demo Data

## Overview
- **Priority**: P2
- **Status**: pending
- **Effort**: 3h

Create comprehensive seed data for development and demo purposes.

---

## Seed Data Requirements

### 4.1 Users & Roles

#### System Roles
```
- SYSTEM_ADMIN (full access)
- TEACHER (course creation, livestream)
- STUDENT (learning, submissions)
- PARENT (view children progress)
```

#### Demo Users
| Email | Role | Name | Notes |
|-------|------|------|-------|
| admin@demo.com | SYSTEM_ADMIN | Admin Demo | Full access |
| teacher1@demo.com | TEACHER | Nguyen Van A | Course creator |
| teacher2@demo.com | TEACHER | Tran Thi B | Livestream host |
| student1@demo.com | STUDENT | Le Van C | Active learner |
| student2@demo.com | STUDENT | Pham Thi D | New user |
| parent1@demo.com | PARENT | Hoang Van E | Parent of student1 |

**Password**: `Demo@123` for all

---

### 4.2 Organizations

```
- org_01: "Trung tam Lap trinh ABC" (code: ABC)
- org_02: "Hoc vien CNTT XYZ" (code: XYZ)
```

#### Org Roles
```
- Admin (org management)
- Instructor (teaching)
- Student (learning)
- TA (teaching assistant)
```

---

### 4.3 Categories & Tags

#### Categories
```
- cat_01: "Lap trinh Web" (icon: globe)
- cat_02: "Lap trinh Mobile" (icon: smartphone)
- cat_03: "Khoa hoc Du lieu" (icon: database)
- cat_04: "DevOps & Cloud" (icon: cloud)
- cat_05: "Thiet ke UI/UX" (icon: palette)
- cat_06: "Lap trinh Game" (icon: gamepad)
```

#### Tags
```
- JavaScript, TypeScript, React, Next.js, Node.js
- Python, Django, FastAPI, Machine Learning
- Flutter, React Native, Swift, Kotlin
- Docker, Kubernetes, AWS, GCP
- Figma, Adobe XD, CSS, Tailwind
```

---

### 4.4 Courses

#### Course 1: "React + Next.js Tu Co Ban Den Nang Cao"
```yaml
instructor: teacher1@demo.com
category: Lap trinh Web
price: 499000
original_price: 999000
level: intermediate
duration: 20 hours
rating: 4.8
student_count: 1250
is_featured: true
sections:
  - "Gioi thieu & Cai dat"
    - Lesson: "Gioi thieu khoa hoc" (video, 10min, preview)
    - Lesson: "Cai dat moi truong" (article)
    - Lesson: "Tao du an dau tien" (video, 15min)
  - "React Fundamentals"
    - Lesson: "Components & Props" (video, 20min)
    - Lesson: "State & Hooks" (video, 25min)
    - Lesson: "Bai tap thuc hanh" (quiz)
  - "Next.js App Router"
    - Lesson: "File-based Routing" (video, 15min)
    - Lesson: "Server Components" (video, 20min)
    - Lesson: "Data Fetching" (video, 25min)
```

#### Course 2: "Python cho Khoa hoc Du lieu"
```yaml
instructor: teacher2@demo.com
category: Khoa hoc Du lieu
price: 699000
level: beginner
duration: 30 hours
rating: 4.6
student_count: 890
sections:
  - "Python Co ban"
  - "NumPy & Pandas"
  - "Matplotlib & Seaborn"
  - "Machine Learning Intro"
```

#### Course 3: "Flutter Mobile Development"
```yaml
instructor: teacher1@demo.com
category: Lap trinh Mobile
price: 599000
level: beginner
duration: 25 hours
is_featured: true
```

#### Course 4: "Docker & Kubernetes"
```yaml
instructor: teacher2@demo.com
category: DevOps & Cloud
price: 799000
level: advanced
duration: 15 hours
```

#### Course 5: Free Course
```yaml
title: "Git & GitHub cho nguoi moi bat dau"
instructor: teacher1@demo.com
category: DevOps & Cloud
price: 0
level: beginner
duration: 5 hours
```

---

### 4.5 Enrollments & Progress

#### Student 1 Enrollments
```
- Course 1: 65% progress (Section 2, Lesson 2)
- Course 3: 20% progress (Section 1, Lesson 3)
- Course 5: 100% complete
```

#### Student 2 Enrollments
```
- Course 2: 10% progress (just started)
```

---

### 4.6 Classes & Schedules

#### Class 1: "Lop React Nang cao - T2/T4/T6"
```yaml
organization: org_01
teachers: [teacher1]
students: [student1, student2]
schedules:
  - Monday 19:00-21:00
  - Wednesday 19:00-21:00
  - Friday 19:00-21:00
```

#### Class 2: "Lop Python DS - T3/T5"
```yaml
organization: org_02
teachers: [teacher2]
students: [student1]
schedules:
  - Tuesday 18:00-20:00
  - Thursday 18:00-20:00
```

---

### 4.7 Vouchers

```yaml
- code: WELCOME20
  type: percentage
  value: 20
  max_discount: 200000
  min_order: 0
  expires: 2026-12-31
  is_public: true

- code: SUMMER50K
  type: fixed
  value: 50000
  min_order: 300000
  expires: 2026-06-30
  is_public: true

- code: VIP100
  type: fixed
  value: 100000
  min_order: 500000
  usage_limit: 100
  is_public: false

- code: FREESHIP
  type: percentage
  value: 100
  max_discount: 50000
  min_order: 0
  is_public: true
```

---

### 4.8 Orders

#### Completed Orders
```
- student1 bought Course 1 (paid 399000 with WELCOME20)
- student1 bought Course 3 (paid 599000)
- student2 bought Course 2 (paid 699000)
```

#### Pending Orders
```
- student2 has Course 4 in cart
```

---

### 4.9 Livestream Sessions

```yaml
# Past session (ended)
- title: "Live coding: Xay dung Todo App"
  host: teacher1
  class: class_01
  status: ended
  started_at: 2026-03-25 19:00
  ended_at: 2026-03-25 21:00
  participant_count: 15

# Scheduled session
- title: "Q&A: Giai dap thac mac React"
  host: teacher1
  class: class_01
  status: scheduled
  scheduled_at: 2026-04-01 19:00
```

---

### 4.10 Assignments & Submissions

#### Assignment 1
```yaml
title: "Bai tap: Tinh tong mang"
session: livestream_01
language: javascript
starter_code: |
  function sum(arr) {
    // Your code here
  }
test_cases:
  - input: "[1,2,3]"
    expected: "6"
  - input: "[]"
    expected: "0"
  - input: "[10]"
    expected: "10"
```

#### Submissions
```
- student1: accepted (100%, 50ms)
- student2: wrong_answer (66%, 45ms)
```

---

## Implementation

### Seed Script Location
**Backend**: `internal/database/seed.go` or `cmd/seed/main.go`

### Seed Command
```bash
# Development seed (full data)
go run cmd/seed/main.go --mode=full

# Minimal seed (just users + roles)
go run cmd/seed/main.go --mode=minimal

# Reset and reseed
go run cmd/seed/main.go --reset --mode=full
```

### Seed Order (Dependencies)
1. System Roles
2. Users (with system roles)
3. Organizations
4. Org Roles
5. User-Org-Role assignments
6. Categories & Tags
7. Teachers & Teacher Profiles
8. Courses (with sections, lessons, content)
9. Classes (with schedules)
10. Enrollments
11. Vouchers
12. Orders
13. Livestream Sessions
14. Assignments
15. Submissions
16. Attendance records

---

## Checklist

- [ ] Create seed data structs/constants
- [ ] Implement seed functions per module
- [ ] Add transaction wrapping for consistency
- [ ] Add idempotency checks (skip if exists)
- [ ] Create CLI command with flags
- [ ] Test full seed on fresh database
- [ ] Document seed accounts in README

---

## Success Criteria
- Fresh database seeds in < 30 seconds
- All demo users can login
- Student can browse/enroll courses
- Teacher can create/manage courses
- Admin can manage users/roles
- Livestream sessions visible
- Cart/Order flow works end-to-end
