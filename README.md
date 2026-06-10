# autofill
Auto frome
# 🚀 Smart Form Autofill Engine — Enterprise Architecture

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Specification](#api-specification)
4. [Browser Extension Structure](#browser-extension-structure)
5. [Security Design](#security-design)
6. [Redis & Caching Strategy](#redis-caching-strategy)
7. [AI Classification Workflow](#ai-classification-workflow)
8. [Folder Structure](#folder-structure)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring Architecture](#monitoring-architecture)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SMART FORM AUTOFILL ENGINE                           │
│                         Enterprise Architecture v1.0                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────┐ │
│  │   Browser Extension  │    │   Web Dashboard      │    │  Mobile App      │ │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │    │  (Future)        │ │
│  │  │ Content Script│  │    │  │ React + TS    │  │    └──────────────────┘ │
│  │  │ Background SW │  │    │  │ Tailwind CSS  │  │                         │
│  │  │ Popup UI      │  │    │  │ Vite          │  │                         │
│  │  │ Options Page  │  │    │  └───────────────┘  │                         │
│  │  └───────────────┘  │    └─────────────────────┘                         │
│  │  Chrome/Edge/Firefox│                                                     │
│  └─────────────────────┘                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                              HTTPS / WSS / gRPC
                                      │
┌──────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Nginx (Load Balancer + SSL Termination)           │    │
│  │              Rate Limiting │ WAF │ DDoS Protection │ Compression     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    API Gateway (Kong / Custom NestJS)                │    │
│  │         Auth Middleware │ Request Routing │ Circuit Breaker          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MICROSERVICES LAYER                                │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Auth Service│  │Profile Service│  │  Form Service│  │  AI Service  │   │
│  │  NestJS      │  │  NestJS      │  │  NestJS      │  │  NestJS      │   │
│  │  Port: 3001  │  │  Port: 3002  │  │  Port: 3003  │  │  Port: 3004  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │Analytics Svc │  │ Audit Service│  │ Sync Service │  │Notification  │   │
│  │  NestJS      │  │  NestJS      │  │  NestJS      │  │  Service     │   │
│  │  Port: 3005  │  │  Port: 3006  │  │  Port: 3007  │  │  Port: 3008  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────┐ │
│  │   PostgreSQL Cluster │    │    Redis Cluster     │    │  Object Storage  │ │
│  │  Primary + 2 Replica│    │  Master + 2 Replica  │    │  (MinIO / S3)    │ │
│  │  PgBouncer Pool      │    │  Sentinel HA         │    │  AI Models       │ │
│  └─────────────────────┘    └─────────────────────┘    └──────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

```sql
-- ============================================================
-- SMART FORM AUTOFILL ENGINE — DATABASE SCHEMA v1.0
-- PostgreSQL 15+
-- ============================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- SCHEMA DEFINITIONS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS profiles;
CREATE SCHEMA IF NOT EXISTS forms;
CREATE SCHEMA IF NOT EXISTS ai_engine;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE auth.user_role AS ENUM (
  'super_admin', 'admin', 'manager', 'user', 'viewer'
);

CREATE TYPE auth.user_status AS ENUM (
  'active', 'inactive', 'suspended', 'pending_verification'
);

CREATE TYPE profiles.field_type AS ENUM (
  'first_name', 'last_name', 'full_name',
  'email', 'phone', 'mobile',
  'address_line1', 'address_line2', 'city',
  'province', 'postal_code', 'country',
  'company', 'tax_id', 'job_title',
  'date_of_birth', 'national_id',
  'credit_card', 'bank_account',
  'username', 'password', 'custom'
);

CREATE TYPE forms.fill_status AS ENUM (
  'success', 'partial', 'failed', 'skipped'
);

CREATE TYPE ai_engine.confidence_level AS ENUM (
  'very_high', 'high', 'medium', 'low', 'uncertain'
);

-- ============================================================
-- AUTH SCHEMA
-- ============================================================
CREATE TABLE auth.users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) NOT NULL UNIQUE,
  email_verified    BOOLEAN DEFAULT FALSE,
  password_hash     TEXT NOT NULL,
  salt              TEXT NOT NULL,
  role              auth.user_role DEFAULT 'user',
  status            auth.user_status DEFAULT 'pending_verification',
  mfa_enabled       BOOLEAN DEFAULT FALSE,
  mfa_secret        TEXT,                          -- AES-256 encrypted
  last_login_at     TIMESTAMPTZ,
  last_login_ip     INET,
  failed_attempts   INTEGER DEFAULT 0,
  locked_until      TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE auth.sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash        TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT,
  device_info       JSONB DEFAULT '{}',
  ip_address        INET,
  user_agent        TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.api_keys (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  key_hash          TEXT NOT NULL UNIQUE,
  key_prefix        VARCHAR(10) NOT NULL,          -- First 8 chars for display
  permissions       JSONB DEFAULT '[]',
  rate_limit        INTEGER DEFAULT 1000,          -- requests per hour
  last_used_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES SCHEMA
-- ============================================================
CREATE TABLE profiles.user_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  is_default        BOOLEAN DEFAULT FALSE,
  color             VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color for UI
  icon              VARCHAR(50) DEFAULT 'user',
  version           INTEGER DEFAULT 1,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE profiles.profile_fields (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL REFERENCES profiles.user_profiles(id) ON DELETE CASCADE,
  field_type        profiles.field_type NOT NULL,
  field_key         VARCHAR(100) NOT NULL,         -- Custom key for custom fields
  encrypted_value   TEXT NOT NULL,                 -- AES-256-GCM encrypted
  iv                TEXT NOT NULL,                 -- Initialization vector
  value_hash        TEXT NOT NULL,                 -- For deduplication (SHA-256)
  display_hint      VARCHAR(50),                   -- e.g., "****1234" for cards
  is_sensitive      BOOLEAN DEFAULT FALSE,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, field_type, field_key)
);

CREATE TABLE profiles.profile_versions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL REFERENCES profiles.user_profiles(id) ON DELETE CASCADE,
  version           INTEGER NOT NULL,
  snapshot          JSONB NOT NULL,               -- Encrypted snapshot
  change_summary    TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FORMS SCHEMA
-- ============================================================
CREATE TABLE forms.form_patterns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain            VARCHAR(255) NOT NULL,
  path_pattern      VARCHAR(500),
  form_signature    TEXT NOT NULL,                -- Hash of form structure
  form_name         VARCHAR(200),
  field_mappings    JSONB NOT NULL DEFAULT '[]',  -- Array of field mapping rules
  fill_count        INTEGER DEFAULT 0,
  success_rate      DECIMAL(5,2) DEFAULT 0,
  confidence_score  DECIMAL(5,4) DEFAULT 0,
  is_verified       BOOLEAN DEFAULT FALSE,
  last_seen_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain, form_signature)
);

CREATE TABLE forms.fill_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  profile_id        UUID NOT NULL REFERENCES profiles.user_profiles(id),
  pattern_id        UUID REFERENCES forms.form_patterns(id),
  domain            VARCHAR(255) NOT NULL,
  url_hash          TEXT NOT NULL,               -- SHA-256 of full URL
  status            forms.fill_status NOT NULL,
  fields_detected   INTEGER DEFAULT 0,
  fields_filled     INTEGER DEFAULT 0,
  fields_failed     INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  scan_time_ms      INTEGER,
  classify_time_ms  INTEGER,
  fill_time_ms      INTEGER,
  error_details     JSONB,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forms.field_fill_details (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES forms.fill_sessions(id) ON DELETE CASCADE,
  field_selector    TEXT NOT NULL,
  field_type        profiles.field_type,
  confidence_score  DECIMAL(5,4),
  was_filled        BOOLEAN DEFAULT FALSE,
  fill_method       VARCHAR(50),                 -- 'autocomplete', 'label', 'ai', etc.
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI ENGINE SCHEMA
-- ============================================================
CREATE TABLE ai_engine.field_classifiers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version           VARCHAR(20) NOT NULL,
  model_type        VARCHAR(50) NOT NULL,         -- 'tensorflow', 'onnx', 'rule_based'
  model_path        TEXT,
  accuracy_score    DECIMAL(5,4),
  training_samples  INTEGER,
  is_active         BOOLEAN DEFAULT FALSE,
  deployed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_engine.training_samples (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_attributes  JSONB NOT NULL,              -- id, name, placeholder, label, etc.
  correct_type      profiles.field_type NOT NULL,
  confidence        DECIMAL(5,4),
  source            VARCHAR(50),                 -- 'user_confirmed', 'auto_detected'
  is_validated      BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_engine.classification_rules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_type        profiles.field_type NOT NULL,
  rule_type         VARCHAR(50) NOT NULL,        -- 'regex', 'keyword', 'pattern'
  rule_value        TEXT NOT NULL,
  weight            DECIMAL(5,4) DEFAULT 1.0,
  language          VARCHAR(10) DEFAULT 'th',    -- 'th', 'en', 'all'
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS SCHEMA
-- ============================================================
CREATE TABLE analytics.daily_stats (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id),
  date              DATE NOT NULL,
  total_fills       INTEGER DEFAULT 0,
  successful_fills  INTEGER DEFAULT 0,
  failed_fills      INTEGER DEFAULT 0,
  unique_domains    INTEGER DEFAULT 0,
  avg_execution_ms  DECIMAL(10,2),
  time_saved_seconds DECIMAL(10,2),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE analytics.domain_stats (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain            VARCHAR(255) NOT NULL,
  total_fills       INTEGER DEFAULT 0,
  success_rate      DECIMAL(5,2),
  avg_fields        DECIMAL(5,2),
  last_filled_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain)
);

-- ============================================================
-- AUDIT SCHEMA
-- ============================================================
CREATE TABLE audit.audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id),
  session_id        UUID REFERENCES auth.sessions(id),
  action            VARCHAR(100) NOT NULL,
  resource_type     VARCHAR(50),
  resource_id       UUID,
  ip_address        INET,
  user_agent        TEXT,
  request_id        UUID,
  old_values        JSONB,                       -- Encrypted sensitive data
  new_values        JSONB,                       -- Encrypted sensitive data
  metadata          JSONB DEFAULT '{}',
  severity          VARCHAR(20) DEFAULT 'info',  -- 'info', 'warning', 'critical'
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Auth indexes
CREATE INDEX idx_users_email ON auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON auth.users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON auth.sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);

-- Profile indexes
CREATE INDEX idx_profiles_user_id ON profiles.user_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_profile_fields_profile_id ON profiles.profile_fields(profile_id);
CREATE INDEX idx_profile_fields_type ON profiles.profile_fields(field_type);

-- Form indexes
CREATE INDEX idx_form_patterns_domain ON forms.form_patterns(domain);
CREATE INDEX idx_form_patterns_signature ON forms.form_patterns(form_signature);
CREATE INDEX idx_fill_sessions_user_id ON forms.fill_sessions(user_id);
CREATE INDEX idx_fill_sessions_created_at ON forms.fill_sessions(created_at DESC);
CREATE INDEX idx_fill_sessions_domain ON forms.fill_sessions(domain);

-- AI indexes
CREATE INDEX idx_training_samples_type ON ai_engine.training_samples(correct_type);
CREATE INDEX idx_classification_rules_type ON ai_engine.classification_rules(field_type);
CREATE INDEX idx_classification_rules_active ON ai_engine.classification_rules(is_active);

-- Audit indexes
CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit.audit_logs(resource_type, resource_id);

-- Analytics indexes
CREATE INDEX idx_daily_stats_user_date ON analytics.daily_stats(user_id, date DESC);
CREATE INDEX idx_domain_stats_domain ON analytics.domain_stats(domain);

-- ============================================================
-- TRIGGERS — Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_form_patterns_updated_at
  BEFORE UPDATE ON forms.form_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 3. API Specification

```yaml
# ============================================================
# SMART FORM AUTOFILL ENGINE — API SPECIFICATION v1.0
# OpenAPI 3.1.0
# ============================================================

openapi: "3.1.0"
info:
  title: Smart Form Autofill Engine API
  version: "1.0.0"
  description: Enterprise-grade Form Autofill Engine REST API

servers:
  - url: https://api.autofill.example.com/v1
    description: Production
  - url: https://staging-api.autofill.example.com/v1
    description: Staging

# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================
paths:
  /auth/register:
    post:
      summary: Register new user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 12
                  pattern: "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])"
      responses:
        "201":
          description: User created successfully
        "409":
          description: Email already exists

  /auth/login:
    post:
      summary: Authenticate user
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                password:
                  type: string
                mfa_code:
                  type: string
                  description: Required if MFA enabled
      responses:
        "200":
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  expires_in:
                    type: integer
                  token_type:
                    type: string
                    example: Bearer

  /auth/refresh:
    post:
      summary: Refresh access token
      security:
        - BearerAuth: []

  /auth/logout:
    post:
      summary: Revoke session
      security:
        - BearerAuth: []

  /auth/mfa/setup:
    post:
      summary: Setup MFA (TOTP)
      security:
        - BearerAuth: []

# ============================================================
# PROFILE ENDPOINTS
# ============================================================
  /profiles:
    get:
      summary: List all profiles
      security:
        - BearerAuth: []
      responses:
        "200":
          description: List of profiles
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Profile"

    post:
      summary: Create new profile
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateProfileRequest"

  /profiles/{profileId}:
    get:
      summary: Get profile by ID
      security:
        - BearerAuth: []
    put:
      summary: Update profile
      security:
        - BearerAuth: []
    delete:
      summary: Delete profile
      security:
        - BearerAuth: []

  /profiles/{profileId}/fields:
    get:
      summary: Get profile fields (masked)
      security:
        - BearerAuth: []
    put:
      summary: Update profile fields
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                fields:
                  type: array
                  items:
                    $ref: "#/components/schemas/ProfileField"

  /profiles/{profileId}/export:
    get:
      summary: Export profile (encrypted)
      security:
        - BearerAuth: []

  /profiles/import:
    post:
      summary: Import profile
      security:
        - BearerAuth: []

# ============================================================
# FORM ENGINE ENDPOINTS
# ============================================================
  /forms/analyze:
    post:
      summary: Analyze form structure and return fill plan
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [form_data, profile_id]
              properties:
                form_data:
                  type: object
                  description: Serialized form DOM structure
                  properties:
                    fields:
                      type: array
                      items:
                        $ref: "#/components/schemas/FormField"
                    domain:
                      type: string
                    url_hash:
                      type: string
                profile_id:
                  type: string
                  format: uuid
      responses:
        "200":
          description: Form analysis result
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/FormAnalysisResult"

  /forms/fill:
    post:
      summary: Execute form fill and return encrypted values
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [session_token, profile_id, field_mappings]
              properties:
                session_token:
                  type: string
                profile_id:
                  type: string
                  format: uuid
                field_mappings:
                  type: array
                  items:
                    $ref: "#/components/schemas/FieldMapping"
      responses:
        "200":
          description: Fill values (encrypted, one-time use)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/FillResponse"

  /forms/patterns:
    get:
      summary: Get learned form patterns for domain
      security:
        - BearerAuth: []
      parameters:
        - name: domain
          in: query
          required: true
          schema:
            type: string

  /forms/patterns/{patternId}/feedback:
    post:
      summary: Submit fill feedback for AI learning
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                was_correct:
                  type: boolean
                corrections:
                  type: array
                  items:
                    type: object
                    properties:
                      field_selector:
                        type: string
                      correct_type:
                        type: string

# ============================================================
# AI ENGINE ENDPOINTS
# ============================================================
  /ai/classify:
    post:
      summary: Classify form fields using AI
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                fields:
                  type: array
                  items:
                    $ref: "#/components/schemas/FormField"
      responses:
        "200":
          description: Classification results
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/ClassificationResult"

  /ai/models/active:
    get:
      summary: Get active AI model info
      security:
        - BearerAuth: []

# ============================================================
# ANALYTICS ENDPOINTS
# ============================================================
  /analytics/dashboard:
    get:
      summary: Get dashboard statistics
      security:
        - BearerAuth: []
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [7d, 30d, 90d, 1y]
            default: 30d

  /analytics/fills:
    get:
      summary: Get fill history with pagination
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: domain
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [success, partial, failed]

  /analytics/performance:
    get:
      summary: Get performance metrics
      security:
        - BearerAuth: []

# ============================================================
# AUDIT ENDPOINTS
# ============================================================
  /audit/logs:
    get:
      summary: Get audit logs (Admin only)
      security:
        - BearerAuth: []
      parameters:
        - name: user_id
          in: query
          schema:
            type: string
        - name: action
          in: query
          schema:
            type: string
        - name: from
          in: query
          schema:
            type: string
            format: date-time
        - name: to
          in: query
          schema:
            type: string
            format: date-time

# ============================================================
# COMPONENTS
# ============================================================
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Profile:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        is_default:
          type: boolean
        color:
          type: string
        icon:
          type: string
        version:
          type: integer
        created_at:
          type: string
          format: date-time

    ProfileField:
      type: object
      properties:
        field_type:
          type: string
        field_key:
          type: string
        value:
          type: string
          description: Plaintext value (encrypted server-side)
        is_sensitive:
          type: boolean

    FormField:
      type: object
      properties:
        selector:
          type: string
        tag_name:
          type: string
        input_type:
          type: string
        id:
          type: string
        name:
          type: string
        placeholder:
          type: string
        label:
          type: string
        aria_label:
          type: string
        autocomplete:
          type: string
        position:
          type: object
          properties:
            x:
              type: number
            y:
              type: number
            index:
              type: integer

    FormAnalysisResult:
      type: object
      properties:
        pattern_id:
          type: string
        confidence_score:
          type: number
        field_mappings:
          type: array
          items:
            $ref: "#/components/schemas/FieldMapping"
        estimated_fill_time_ms:
          type: integer
        warnings:
          type: array
          items:
            type: string

    FieldMapping:
      type: object
      properties:
        selector:
          type: string
        field_type:
          type: string
        confidence:
          type: number
        fill_method:
          type: string

    FillResponse:
      type: object
      properties:
        session_id:
          type: string
        fill_token:
          type: string
          description: One-time encrypted token for fill values
        expires_in:
          type: integer
          description: Seconds until token expires (max 30s)
        field_values:
          type: array
          items:
            type: object
            properties:
              selector:
                type: string
              encrypted_value:
                type: string
              iv:
                type: string

    ClassificationResult:
      type: object
      properties:
        selector:
          type: string
        predicted_type:
          type: string
        confidence:
          type: number
        confidence_level:
          type: string
          enum: [very_high, high, medium, low, uncertain]
        alternative_types:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
              confidence:
                type: number
```

---

## 4. Browser Extension Structure

```
browser-extension/
├── manifest.json                    # MV3 Manifest
├── src/
│   ├── background/
│   │   ├── service-worker.ts        # Main SW entry point
│   │   ├── api-client.ts            # Backend API communication
│   │   ├── auth-manager.ts          # Token management
│   │   ├── cache-manager.ts         # Local cache (IndexedDB)
│   │   ├── crypto-manager.ts        # Client-side encryption
│   │   ├── message-handler.ts       # Chrome message routing
│   │   └── sync-manager.ts          # Profile sync
│   │
│   ├── content/
│   │   ├── index.ts                 # Content script entry
│   │   ├── form-detector.ts         # Form detection engine
│   │   ├── field-analyzer.ts        # Field attribute analysis
│   │   ├── shadow-dom-handler.ts    # Shadow DOM traversal
│   │   ├── frame-handler.ts         # iFrame handling
│   │   ├── spa-observer.ts          # MutationObserver for SPA
│   │   ├── autofill-engine.ts       # Fill execution engine
│   │   ├── field-highlighter.ts     # Visual field highlighting
│   │   ├── suggestion-ui.ts         # Inline suggestion UI
│   │   └── event-handler.ts         # DOM event management
│   │
│   ├── popup/
│   │   ├── App.tsx                  # Popup root
│   │   ├── components/
│   │   │   ├── ProfileSelector.tsx  # Profile switcher
│   │   │   ├── QuickFill.tsx        # One-click fill button
│   │   │   ├── FormStatus.tsx       # Current page form status
│   │   │   ├── RecentFills.tsx      # Recent fill history
│   │   │   └── Settings.tsx         # Quick settings
│   │   └── hooks/
│   │       ├── useProfile.ts
│   │       └── useFormStatus.ts
│   │
│   ├── options/
│   │   ├── App.tsx                  # Options page root
│   │   ├── pages/
│   │   │   ├── ProfileManager.tsx   # Full profile management
│   │   │   ├── SecuritySettings.tsx # Security configuration
│   │   │   ├── SyncSettings.tsx     # Cloud sync settings
│   │   │   └── About.tsx
│   │   └── components/
│   │       ├── FieldEditor.tsx      # Edit profile fields
│   │       └── ImportExport.tsx     # Profile import/export
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   ├── form.types.ts
│   │   │   ├── profile.types.ts
│   │   │   └── message.types.ts
│   │   ├── utils/
│   │   │   ├── crypto.utils.ts      # AES-256-GCM utilities
│   │   │   ├── selector.utils.ts    # CSS selector generation
│   │   │   └── validation.utils.ts
│   │   └── constants/
│   │       ├── field-patterns.ts    # Regex patterns per field type
│   │       └── api.constants.ts
│   │
│   └── ai/
│       ├── classifier.ts            # TensorFlow.js classifier
│       ├── model-loader.ts          # ONNX model loader
│       ├── feature-extractor.ts     # Field feature extraction
│       └── rule-engine.ts           # Rule-based fallback
│
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   ├── models/
│   │   └── field-classifier.onnx    # Bundled AI model
│   └── _locales/
│       ├── en/messages.json
│       └── th/messages.json
│
├── manifest.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### manifest.json (MV3)

```json
{
  "manifest_version": 3,
  "name": "Smart Form Autofill Engine",
  "version": "1.0.0",
  "description": "Enterprise-grade intelligent form autofill",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "alarms",
    "identity"
  ],
  "host_permissions": [
    "https://api.autofill.example.com/*",
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "run_at": "document_idle",
      "all_frames": true
    }
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    }
  },
  "options_ui": {
    "page": "options/index.html",
    "open_in_tab": true
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  },
  "web_accessible_resources": [
    {
      "resources": ["models/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Core Content Script — Form Detector

```typescript
// content/form-detector.ts
export class FormDetector {
  private observer: MutationObserver;
  private detectedForms: Map<string, FormData> = new Map();
  private scanTimeout: number | null = null;

  constructor(private readonly analyzer: FieldAnalyzer) {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  async initialize(): Promise<void> {
    // Initial scan
    await this.scanDocument();

    // Watch for dynamic changes (SPA support)
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['type', 'name', 'id', 'placeholder'],
    });
  }

  private async scanDocument(): Promise<FormScanResult> {
    const startTime = performance.now();

    const fields = await this.collectAllFields();
    const scanTime = performance.now() - startTime;

    // Must be < 50ms
    if (scanTime > 50) {
      console.warn(`[AutoFill] Scan exceeded 50ms: ${scanTime.toFixed(2)}ms`);
    }

    return { fields, scanTime };
  }

  private async collectAllFields(): Promise<FieldInfo[]> {
    const fields: FieldInfo[] = [];

    // Standard DOM fields
    fields.push(...this.scanStandardFields(document));

    // Shadow DOM fields
    fields.push(...await this.scanShadowDOM(document.body));

    // iFrame fields
    fields.push(...await this.scanFrames());

    return fields;
  }

  private scanStandardFields(root: Document | ShadowRoot): FieldInfo[] {
    const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select';
    const elements = root.querySelectorAll<HTMLElement>(selector);

    return Array.from(elements).map((el, index) =>
      this.analyzer.extractFieldInfo(el, index)
    );
  }

  private async scanShadowDOM(root: Element): Promise<FieldInfo[]> {
    const fields: FieldInfo[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    let node: Node | null = walker.currentNode;
    while (node) {
      if (node instanceof Element && node.shadowRoot) {
        fields.push(...this.scanStandardFields(node.shadowRoot));
        fields.push(...await this.scanShadowDOM(node.shadowRoot as unknown as Element));
      }
      node = walker.nextNode();
    }

    return fields;
  }

  private async scanFrames(): Promise<FieldInfo[]> {
    const fields: FieldInfo[] = [];
    const frames = document.querySelectorAll('iframe');

    for (const frame of frames) {
      try {
        const frameDoc = frame.contentDocument;
        if (frameDoc) {
          fields.push(...this.scanStandardFields(frameDoc));
        }
      } catch {
        // Cross-origin frame — skip
      }
    }

    return fields;
  }

  private handleMutations(mutations: MutationRecord[]): void {
    const hasFormChanges = mutations.some(m =>
      Array.from(m.addedNodes).some(n =>
        n instanceof Element &&
        (n.matches('input, textarea, select, form') ||
         n.querySelector('input, textarea, select, form'))
      )
    );

    if (hasFormChanges) {
      // Debounce re-scan
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = window.setTimeout(() => this.scanDocument(), 300);
    }
  }

  destroy(): void {
    this.observer.disconnect();
    if (this.scanTimeout) clearTimeout(this.scanTimeout);
  }
}
```

---

## 5. Security Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 1: TRANSPORT SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  TLS 1.3 Only │ HSTS │ Certificate Pinning │ OCSP Stapling                  │
│  Perfect Forward Secrecy │ Strong Cipher Suites Only                        │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 2: AUTHENTICATION & AUTHORIZATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  JWT (RS256) │ Refresh Token Rotation │ MFA (TOTP) │ Session Binding        │
│  RBAC (Role-Based Access Control) │ API Key Management                      │
│  Device Fingerprinting │ Anomaly Detection                                  │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 3: DATA ENCRYPTION
┌─────────────────────────────────────────────────────────────────────────────┐
│  At Rest: AES-256-GCM per field │ Key Derivation: PBKDF2 (310,000 iter)    │
│  In Transit: TLS 1.3 │ Key Rotation: 90-day cycle                          │
│  Zero Plaintext: Sensitive data never stored unencrypted                    │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 4: APPLICATION SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  Input Validation │ SQL Injection Prevention (Parameterized Queries)        │
│  XSS Prevention │ CSRF Protection │ Rate Limiting │ Request Signing         │
│  Content Security Policy │ Subresource Integrity                            │
└─────────────────────────────────────────────────────────────────────────────┘

LAYER 5: INFRASTRUCTURE SECURITY
┌─────────────────────────────────────────────────────────────────────────────┐
│  Network Segmentation │ WAF │ DDoS Protection │ Secrets Management (Vault) │
│  Container Security │ Image Scanning │ Least Privilege │ Audit Logging      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Encryption Implementation

```typescript
// shared/utils/crypto.utils.ts
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class CryptoService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly SCRYPT_N = 16384;
  private static readonly SCRYPT_R = 8;
  private static readonly SCRYPT_P = 1;

  /**
   * Encrypt sensitive field value
   * Returns: base64(salt) + ":" + base64(iv) + ":" + base64(ciphertext+tag)
   */
  static async encrypt(plaintext: string, masterKey: string): Promise<EncryptedData> {
    const salt = randomBytes(this.SALT_LENGTH);
    const iv = randomBytes(this.IV_LENGTH);

    // Derive key from master key + salt
    const key = await scryptAsync(masterKey, salt, this.KEY_LENGTH, {
      N: this.SCRYPT_N,
      r: this.SCRYPT_R,
      p: this.SCRYPT_P,
    }) as Buffer;

    const cipher = createCipheriv(this.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
      encrypted_value: Buffer.concat([encrypted, tag]).toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  static async decrypt(data: EncryptedData, masterKey: string): Promise<string> {
    const salt = Buffer.from(data.salt, 'base64');
    const iv = Buffer.from(data.iv, 'base64');
    const encryptedWithTag = Buffer.from(data.encrypted_value, 'base64');

    const key = await scryptAsync(masterKey, salt, this.KEY_LENGTH, {
      N: this.SCRYPT_N,
      r: this.SCRYPT_R,
      p: this.SCRYPT_P,
    }) as Buffer;

    const tag = encryptedWithTag.slice(-this.TAG_LENGTH);
    const encrypted = encryptedWithTag.slice(0, -this.TAG_LENGTH);

    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }

  /**
   * Generate one-time fill token (expires in 30 seconds)
   */
  static generateFillToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash for deduplication (non-reversible)
   */
  static hashValue(value: string, salt: string): string {
    const { createHmac } = require('crypto');
    return createHmac('sha256', salt).update(value).digest('hex');
  }
}

interface EncryptedData {
  encrypted_value: string;
  iv: string;
  salt: string;
}
```

---

## 6. Redis & Caching Strategy

```typescript
// ============================================================
// REDIS STRATEGY — Key Design & TTL Policy
// ============================================================

/*
KEY NAMING CONVENTION:
  {service}:{entity}:{id}:{sub-key}

CACHE TIERS:
  L1 — In-Memory (Extension/Browser): 5 minutes
  L2 — Redis (Hot Cache): 15 minutes - 24 hours
  L3 — PostgreSQL (Persistent): Permanent

TTL POLICY:
  ┌─────────────────────────────────────────────────────────┐
  │ Key Pattern                    │ TTL      │ Strategy    │
  ├─────────────────────────────────────────────────────────┤
  │ auth:session:{token_hash}      │ 1 hour   │ Sliding     │
  │ auth:refresh:{token_hash}      │ 7 days   │ Fixed       │
  │ auth:rate_limit:{ip}           │ 1 minute │ Fixed       │
  │ auth:failed_attempts:{user_id} │ 15 min   │ Fixed       │
  │ profile:data:{user_id}         │ 15 min   │ Sliding     │
  │ profile:fields:{profile_id}    │ 10 min   │ Sliding     │
  │ form:pattern:{domain}:{hash}   │ 24 hours │ Fixed       │
  │ form:fill_token:{token}        │ 30 sec   │ Fixed       │
  │ ai:model:metadata              │ 1 hour   │ Fixed       │
  │ ai:classification:{hash}       │ 1 hour   │ Fixed       │
  │ analytics:dashboard:{user_id}  │ 5 min    │ Fixed       │
  │ analytics:daily:{user_id}:{dt} │ 24 hours │ Fixed       │
  └─────────────────────────────────────────────────────────┘
*/

export class RedisService {
  private readonly client: Redis;
  private readonly prefix = 'autofill';

  // ── Profile Cache ──────────────────────────────────────────
  async cacheProfile(userId: string, profileData: ProfileCache): Promise<void> {
    const key = `${this.prefix}:profile:data:${userId}`;
    await this.client.setex(key, 900, JSON.stringify(profileData)); // 15 min
  }

  async getProfileCache(userId: string): Promise<ProfileCache | null> {
    const key = `${this.prefix}:profile:data:${userId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateProfileCache(userId: string): Promise<void> {
    const pattern = `${this.prefix}:profile:*:${userId}*`;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(...keys);
  }

  // ── Form Pattern Cache ─────────────────────────────────────
  async cacheFormPattern(domain: string, signature: string, pattern: FormPattern): Promise<void> {
    const key = `${this.prefix}:form:pattern:${domain}:${signature}`;
    await this.client.setex(key, 86400, JSON.stringify(pattern)); // 24 hours
  }

  async getFormPattern(domain: string, signature: string): Promise<FormPattern | null> {
    const key = `${this.prefix}:form:pattern:${domain}:${signature}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ── One-Time Fill Token ────────────────────────────────────
  async storeFillToken(token: string, fillData: FillTokenData): Promise<void> {
    const key = `${this.prefix}:form:fill_token:${token}`;
    // 30 seconds — one-time use
    await this.client.setex(key, 30, JSON.stringify(fillData));
  }

  async consumeFillToken(token: string): Promise<FillTokenData | null> {
    const key = `${this.prefix}:form:fill_token:${token}`;
    const data = await this.client.get(key);
    if (data) {
      await this.client.del(key); // Consume immediately
      return JSON.parse(data);
    }
    return null;
  }

  // ── Rate Limiting ──────────────────────────────────────────
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const key = `${this.prefix}:rate_limit:${identifier}`;
    const current = await this.client.incr(key);

    if (current === 1) {
      await this.client.expire(key, windowSeconds);
    }

    const ttl = await this.client.ttl(key);

    return {
      allowed: current <= limit,
      current,
      limit,
      reset_in: ttl,
    };
  }

  // ── Session Management ─────────────────────────────────────
  async storeSession(tokenHash: string, sessionData: SessionData): Promise<void> {
    const key = `${this.prefix}:auth:session:${tokenHash}`;
    await this.client.setex(key, 3600, JSON.stringify(sessionData));
  }

  async getSession(tokenHash: string): Promise<SessionData | null> {
    const key = `${this.prefix}:auth:session:${tokenHash}`;
    const data = await this.client.get(key);
    if (data) {
      // Sliding window — reset TTL on access
      await this.client.expire(key, 3600);
      return JSON.parse(data);
    }
    return null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const key = `${this.prefix}:auth:session:${tokenHash}`;
    await this.client.del(key);
  }

  // ── AI Classification Cache ────────────────────────────────
  async cacheClassification(fieldHash: string, result: ClassificationResult): Promise<void> {
    const key = `${this.prefix}:ai:classification:${fieldHash}`;
    await this.client.setex(key, 3600, JSON.stringify(result)); // 1 hour
  }

  async getClassificationCache(fieldHash: string): Promise<ClassificationResult | null> {
    const key = `${this.prefix}:ai:classification:${fieldHash}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ── Analytics Cache ────────────────────────────────────────
  async cacheDashboard(userId: string, stats: DashboardStats): Promise<void> {
    const key = `${this.prefix}:analytics:dashboard:${userId}`;
    await this.client.setex(key, 300, JSON.stringify(stats)); // 5 min
  }

  // ── Pub/Sub for Real-time Sync ─────────────────────────────
  async publishProfileUpdate(userId: string, event: ProfileUpdateEvent): Promise<void> {
    const channel = `${this.prefix}:events:profile:${userId}`;
    await this.client.publish(channel, JSON.stringify(event));
  }
}
```

---

## 7. AI Classification Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI CLASSIFICATION PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

INPUT: FormField {
  id, name, placeholder, label, aria-label,
  autocomplete, type, position, DOM context
}
         │
         ▼
┌─────────────────────┐
│  STAGE 1: FAST PATH │  < 5ms
│  Autocomplete Check │──── autocomplete="email" ──────────────► RESULT (1.0)
│  (Deterministic)    │──── autocomplete="tel" ────────────────► RESULT (1.0)
└─────────────────────┘
         │ No autocomplete
         ▼
┌─────────────────────┐
│  STAGE 2: CACHE     │  < 2ms
│  Redis Lookup       │──── Cache HIT ─────────────────────────► RESULT
│  (Field Hash)       │
└─────────────────────┘
         │ Cache MISS
         ▼
┌─────────────────────┐
│  STAGE 3: RULE      │  < 10ms
│  ENGINE             │
│  ┌───────────────┐  │
│  │ Regex Patterns│  │  id/name matches: email, phone, etc.
│  │ Keyword Match │  │  label contains: "อีเมล", "email"
│  │ Thai/English  │  │  placeholder: "กรอกอีเมล"
│  └───────────────┘  │
│  Confidence > 0.85? │──── YES ───────────────────────────────► RESULT
└─────────────────────┘
         │ Confidence < 0.85
         ▼
┌─────────────────────┐
│  STAGE 4: AI MODEL  │  < 30ms
│  ┌───────────────┐  │
│  │Feature Extract│  │  Vectorize field attributes
│  │  - Text embed │  │  + DOM position features
│  │  - Position   │  │  + Sibling context
│  │  - Context    │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ ONNX Runtime  │  │  Primary: ONNX (fast inference)
│  │ TF.js Fallback│  │  Fallback: TensorFlow.js
│  └───────────────┘  │
│  Confidence > 0.70? │──── YES ───────────────────────────────► RESULT
└─────────────────────┘
         │ Confidence < 0.70
         ▼
┌─────────────────────┐
│  STAGE 5: CONTEXT   │  < 15ms
│  ANALYSIS           │
│  - Sibling fields   │  "First Name" before "Last Name"
│  - Form structure   │  Checkout form → address fields
│  - Page context     │  Registration → email + password
│  - Historical data  │  Same domain patterns
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  STAGE 6: ENSEMBLE  │
│  SCORING            │
│  Weighted average:  │
│  Rule: 40%          │
│  AI Model: 40%      │
│  Context: 20%       │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  OUTPUT + LEARNING  │
│  - Store in cache   │
│  - Update patterns  │
│  - Confidence score │
│  - Feedback loop    │
└─────────────────────┘
```

### AI Service Implementation

```typescript
// services/ai/field-classifier.service.ts
@Injectable()
export class FieldClassifierService {
  private readonly CONFIDENCE_THRESHOLDS = {
    AUTOCOMPLETE: 1.0,
    RULE_HIGH: 0.85,
    AI_ACCEPT: 0.70,
    MINIMUM: 0.50,
  };

  constructor(
    private readonly ruleEngine: RuleEngineService,
    private readonly onnxService: OnnxInferenceService,
    private readonly cacheService: RedisService,
    private readonly patternService: FormPatternService,
  ) {}

  async classifyField(field: FormField): Promise<ClassificationResult> {
    const startTime = performance.now();

    // Stage 1: Autocomplete (deterministic)
    if (field.autocomplete) {
      const type = this.mapAutocompleteToType(field.autocomplete);
      if (type) {
        return this.buildResult(type, 1.0, 'autocomplete', startTime);
      }
    }

    // Stage 2: Cache lookup
    const fieldHash = this.hashField(field);
    const cached = await this.cacheService.getClassificationCache(fieldHash);
    if (cached) return { ...cached, from_cache: true };

    // Stage 3: Rule engine
    const ruleResult = await this.ruleEngine.classify(field);
    if (ruleResult.confidence >= this.CONFIDENCE_THRESHOLDS.RULE_HIGH) {
      await this.cacheService.cacheClassification(fieldHash, ruleResult);
      return this.buildResult(ruleResult.type, ruleResult.confidence, 'rule', startTime);
    }

    // Stage 4: AI Model (ONNX)
    const features = this.extractFeatures(field);
    const aiResult = await this.onnxService.infer(features);

    if (aiResult.confidence >= this.CONFIDENCE_THRESHOLDS.AI_ACCEPT) {
      await this.cacheService.cacheClassification(fieldHash, aiResult);
      return this.buildResult(aiResult.type, aiResult.confidence, 'ai_model', startTime);
    }

    // Stage 5 & 6: Ensemble
    const ensembleResult = this.ensembleScore(ruleResult, aiResult);
    await this.cacheService.cacheClassification(fieldHash, ensembleResult);

    return this.buildResult(
      ensembleResult.type,
      ensembleResult.confidence,
      'ensemble',
      startTime
    );
  }

  private ensembleScore(
    ruleResult: ClassificationResult,
    aiResult: ClassificationResult
  ): ClassificationResult {
    // Weighted ensemble: Rule 40%, AI 40%, Context 20%
    const RULE_WEIGHT = 0.4;
    const AI_WEIGHT = 0.4;

    if (ruleResult.type === aiResult.type) {
      return {
        type: ruleResult.type,
        confidence: (ruleResult.confidence * RULE_WEIGHT) + (aiResult.confidence * AI_WEIGHT) + 0.2,
      };
    }

    // Disagreement — pick higher confidence
    return ruleResult.confidence > aiResult.confidence ? ruleResult : aiResult;
  }

  private extractFeatures(field: FormField): Float32Array {
    // Feature vector: [text_embeddings(128), position(4), type_encoding(10)]
    const textFeatures = this.embedText([
      field.id, field.name, field.placeholder,
      field.label, field.ariaLabel
    ].filter(Boolean).join(' '));

    const positionFeatures = new Float32Array([
      field.position.x / window.innerWidth,
      field.position.y / window.innerHeight,
      field.position.index / 20,
      field.position.y < 300 ? 1 : 0, // Above fold
    ]);

    return this.concatFeatures(textFeatures, positionFeatures);
  }

  private mapAutocompleteToType(autocomplete: string): FieldType | null {
    const mapping: Record<string, FieldType> = {
      'given-name': 'first_name',
      'family-name': 'last_name',
      'name': 'full_name',
      'email': 'email',
      'tel': 'phone',
      'tel-national': 'phone',
      'street-address': 'address_line1',
      'address-line1': 'address_line1',
      'address-line2': 'address_line2',
      'address-level1': 'province',
      'address-level2': 'city',
      'postal-code': 'postal_code',
      'country': 'country',
      'organization': 'company',
      'bday': 'date_of_birth',
      'username': 'username',
      'current-password': 'password',
      'new-password': 'password',
    };
    return mapping[autocomplete] || null;
  }
}
```

---

## 8. Folder Structure

```
smart-form-autofill/
├── .gitlab/
│   ├── ci/
│   │   ├── build.yml
│   │   ├── test.yml
│   │   ├── security.yml
│   │   └── deploy.yml
│   └── CODEOWNERS
│
├── apps/
│   ├── api-gateway/                 # NestJS API Gateway
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rate-limit.middleware.ts
│   │   │   │   └── request-id.middleware.ts
│   │   │   └── proxy/
│   │   │       └── service-proxy.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── auth-service/                # Authentication Service
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── mfa.service.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── users.repository.ts
│   │   │   └── sessions/
│   │   │       ├── sessions.service.ts
│   │   │       └── sessions.repository.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── profile-service/             # Profile Management Service
│   │   ├── src/
│   │   │   ├── profiles/
│   │   │   │   ├── profiles.module.ts
│   │   │   │   ├── profiles.controller.ts
│   │   │   │   ├── profiles.service.ts
│   │   │   │   └── profiles.repository.ts
│   │   │   ├── fields/
│   │   │   │   ├── fields.service.ts
│   │   │   │   └── encryption.service.ts
│   │   │   └── versioning/
│   │   │       └── versioning.service.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── form-service/                # Form Analysis & Fill Service
│   │   ├── src/
│   │   │   ├── analyzer/
│   │   │   │   ├── form-analyzer.service.ts
│   │   │   │   └── field-extractor.service.ts
│   │   │   ├── filler/
│   │   │   │   ├── form-filler.service.ts
│   │   │   │   └── fill-token.service.ts
│   │   │   └── patterns/
│   │   │       ├── pattern.service.ts
│   │   │       └── pattern.repository.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── ai-service/                  # AI Classification Service
│   │   ├── src/
│   │   │   ├── classifier/
│   │   │   │   ├── field-classifier.service.ts
│   │   │   │   ├── rule-engine.service.ts
│   │   │   │   └── ensemble.service.ts
│   │   │   ├── models/
│   │   │   │   ├── onnx-inference.service.ts
│   │   │   │   └── model-manager.service.ts
│   │   │   ├── training/
│   │   │   │   ├── training.service.ts
│   │   │   │   └── sample.repository.ts
│   │   │   └── rules/
│   │   │       ├── thai-patterns.ts
│   │   │       └── english-patterns.ts
│   │   ├── models/
│   │   │   └── field-classifier-v1.onnx
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── analytics-service/           # Analytics & Reporting
│   │   ├── src/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   └── aggregator/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── audit-service/               # Audit Logging Service
│   │   ├── src/
│   │   │   ├── audit/
│   │   │   └── retention/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── dashboard-web/               # React Dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── App.tsx
│   │   │   │   ├── router.tsx
│   │   │   │   └── store.ts
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Profiles/
│   │   │   │   ├── Analytics/
│   │   │   │   ├── AuditLogs/
│   │   │   │   └── Settings/
│   │   │   ├── components/
│   │   │   │   ├── ui/              # Shadcn/ui components
│   │   │   │   ├── charts/
│   │   │   │   └── forms/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   │   └── api/
│   │   │   └── utils/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── browser-extension/           # Browser Extension (see Section 4)
│
├── packages/                        # Shared packages (monorepo)
│   ├── shared-types/                # TypeScript types
│   │   ├── src/
│   │   │   ├── auth.types.ts
│   │   │   ├── profile.types.ts
│   │   │   ├── form.types.ts
│   │   │   └── api.types.ts
│   │   └── package.json
│   │
│   ├── shared-crypto/               # Encryption utilities
│   │   ├── src/
│   │   │   ├── aes.ts
│   │   │   ├── hash.ts
│   │   │   └── token.ts
│   │   └── package.json
│   │
│   ├── shared-validators/           # Validation schemas (Zod)
│   │   ├── src/
│   │   │   ├── auth.schema.ts
│   │   │   ├── profile.schema.ts
│   │   │   └── form.schema.ts
│   │   └── package.json
│   │
│   └── shared-logger/               # Structured logging
│       ├── src/
│       │   └── logger.ts
│       └── package.json
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   │
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── ingress/
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   └── hpa/
│   │
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── ssl/
│   │
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── modules/
│   │
│   └── vault/
│       └── policies/
│
├── scripts/
│   ├── db-migrate.sh
│   ├── db-seed.sh
│   └── generate-keys.sh
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── deployment/
│   └── security/
│
├── .gitlab-ci.yml
├── turbo.json                       # Turborepo config
├── pnpm-workspace.yaml
└── package.json
```

---

## 9. Deployment Architecture

```yaml
# ============================================================
# KUBERNETES DEPLOYMENT — Production
# ============================================================

# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: autofill-prod
  labels:
    environment: production

---
# ── Auth Service Deployment ────────────────────────────────
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: autofill-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: auth-service
        version: "1.0.0"
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values: [auth-service]
              topologyKey: kubernetes.io/hostname
      containers:
        - name: auth-service
          image: registry.example.com/autofill/auth-service:1.0.0
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: auth-service-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
            - name: JWT_PRIVATE_KEY
              valueFrom:
                secretKeyRef:
                  name: jwt-keys
                  key: private-key
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false

---
# ── Horizontal Pod Autoscaler ──────────────────────────────
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: autofill-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

---
# ── Ingress ────────────────────────────────────────────────
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: autofill-ingress
  namespace: autofill-prod
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.autofill.example.com
      secretName: autofill-tls
  rules:
    - host: api.autofill.example.com
      http:
        paths:
          - path: /v1/auth
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 3001
          - path: /v1/profiles
            pathType: Prefix
            backend:
              service:
                name: profile-service
                port:
                  number: 3002
          - path: /v1/forms
            pathType: Prefix
            backend:
              service:
                name: form-service
                port:
                  number: 3003
          - path: /v1/ai
            pathType: Prefix
            backend:
              service:
                name: ai-service
                port:
                  number: 3004

---
# ── PostgreSQL StatefulSet ─────────────────────────────────
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
  namespace: autofill-prod
spec:
  serviceName: postgresql
  replicas: 3
  selector:
    matchLabels:
      app: postgresql
  template:
    spec:
      containers:
        - name: postgresql
          image: postgres:15-alpine
          env:
            - name: POSTGRES_DB
              value: autofill
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
          volumeMounts:
            - name: postgresql-data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgresql-data
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 100Gi
```

### GitLab CI/CD Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - security
  - build
  - deploy-staging
  - integration-test
  - deploy-production

variables:
  DOCKER_REGISTRY: registry.gitlab.com/psa_online/autofill
  NODE_VERSION: "20"

# ── Validate ───────────────────────────────────────────────
lint:
  stage: validate
  image: node:20-alpine
  script:
    - corepack enable && pnpm install --frozen-lockfile
    - pnpm run lint
    - pnpm run type-check
  cache:
    key: pnpm-$CI_COMMIT_REF_SLUG
    paths: [node_modules/, .pnpm-store/]

# ── Test ───────────────────────────────────────────────────
unit-test:
  stage: test
  image: node:20-alpine
  services:
    - postgres:15-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: autofill_test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres/autofill_test
    REDIS_URL: redis://redis:6379
  script:
    - pnpm install --frozen-lockfile
    - pnpm run test:unit --coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# ── Security ───────────────────────────────────────────────
sast:
  stage: security
  include:
    - template: Security/SAST.gitlab-ci.yml

dependency-scan:
  stage: security
  include:
    - template: Security/Dependency-Scanning.gitlab-ci.yml

secret-detection:
  stage: security
  include:
    - template: Security/Secret-Detection.gitlab-ci.yml

container-scan:
  stage: security
  include:
    - template: Security/Container-Scanning.gitlab-ci.yml

# ── Build ──────────────────────────────────────────────────
.build-service: &build-service
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker build \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$CI_COMMIT_SHA \
        --build-arg VERSION=$CI_COMMIT_TAG \
        -t $DOCKER_REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA \
        -t $DOCKER_REGISTRY/$SERVICE_NAME:latest \
        apps/$SERVICE_NAME/
    - docker push $DOCKER_REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/$SERVICE_NAME:latest

build-auth-service:
  <<: *build-service
  variables:
    SERVICE_NAME: auth-service

build-profile-service:
  <<: *build-service
  variables:
    SERVICE_NAME: profile-service

build-form-service:
  <<: *build-service
  variables:
    SERVICE_NAME: form-service

build-ai-service:
  <<: *build-service
  variables:
    SERVICE_NAME: ai-service

# ── Deploy Staging ─────────────────────────────────────────
deploy-staging:
  stage: deploy-staging
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging-api.autofill.example.com
  script:
    - kubectl config use-context $KUBE_CONTEXT_STAGING
    - kubectl set image deployment/auth-service auth-service=$DOCKER_REGISTRY/auth-service:$CI_COMMIT_SHA -n autofill-staging
    - kubectl set image deployment/profile-service profile-service=$DOCKER_REGISTRY/profile-service:$CI_COMMIT_SHA -n autofill-staging
    - kubectl set image deployment/form-service form-service=$DOCKER_REGISTRY/form-service:$CI_COMMIT_SHA -n autofill-staging
    - kubectl set image deployment/ai-service ai-service=$DOCKER_REGISTRY/ai-service:$CI_COMMIT_SHA -n autofill-staging
    - kubectl rollout status deployment/auth-service -n autofill-staging --timeout=5m
  only:
    - develop

# ── Deploy Production ──────────────────────────────────────
deploy-production:
  stage: deploy-production
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://api.autofill.example.com
  script:
    - kubectl config use-context $KUBE_CONTEXT_PROD
    - |
      for service in auth-service profile-service form-service ai-service; do
        kubectl set image deployment/$service $service=$DOCKER_REGISTRY/$service:$CI_COMMIT_SHA -n autofill-prod
        kubectl rollout status deployment/$service -n autofill-prod --timeout=10m
      done
  when: manual
  only:
    - main
  needs:
    - deploy-staging
```

---

## 10. Monitoring Architecture

```yaml
# ============================================================
# MONITORING STACK
# Prometheus + Grafana + Loki + Jaeger
# ============================================================

# prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: [alertmanager:9093]

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: auth-service
    static_configs:
      - targets: [auth-service:3001]
    metrics_path: /metrics

  - job_name: profile-service
    static_configs:
      - targets: [profile-service:3002]

  - job_name: form-service
    static_configs:
      - targets: [form-service:3003]

  - job_name: ai-service
    static_configs:
      - targets: [ai-service:3004]

  - job_name: postgresql
    static_configs:
      - targets: [postgres-exporter:9187]

  - job_name: redis
    static_configs:
      - targets: [redis-exporter:9121]

  - job_name: nginx
    static_configs:
      - targets: [nginx-exporter:9113]
```

```typescript
// ── Custom Metrics (NestJS) ────────────────────────────────
// shared/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  // Form Fill Metrics
  readonly fillTotal = new Counter({
    name: 'autofill_fill_total',
    help: 'Total number of form fills',
    labelNames: ['status', 'domain', 'profile_id'],
  });

  readonly fillDuration = new Histogram({
    name: 'autofill_fill_duration_ms',
    help: 'Form fill execution time in milliseconds',
    labelNames: ['stage'],
    buckets: [10, 25, 50, 100, 150, 200, 250, 500],
  });

  // AI Classification Metrics
  readonly classificationTotal = new Counter({
    name: 'autofill_classification_total',
    help: 'Total field classifications',
    labelNames: ['method', 'field_type', 'confidence_level'],
  });

  readonly classificationDuration = new Histogram({
    name: 'autofill_classification_duration_ms',
    help: 'Classification time in milliseconds',
    labelNames: ['stage'],
    buckets: [1, 5, 10, 20, 30, 50, 100],
  });

  // Cache Metrics
  readonly cacheHits = new Counter({
    name: 'autofill_cache_hits_total',
    help: 'Cache hit count',
    labelNames: ['cache_type'],
  });

  readonly cacheMisses = new Counter({
    name: 'autofill_cache_misses_total',
    help: 'Cache miss count',
    labelNames: ['cache_type'],
  });

  // Active Sessions
  readonly activeSessions = new Gauge({
    name: 'autofill_active_sessions',
    help: 'Number of active user sessions',
  });

  // API Metrics
  readonly httpRequestDuration = new Histogram({
    name: 'autofill_http_request_duration_ms',
    help: 'HTTP request duration',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000],
  });

  readonly httpRequestTotal = new Counter({
    name: 'autofill_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  // Performance SLA Tracking
  readonly slaViolations = new Counter({
    name: 'autofill_sla_violations_total',
    help: 'SLA violation count',
    labelNames: ['operation', 'threshold_ms'],
  });

  trackFillPerformance(stage: string, durationMs: number): void {
    this.fillDuration.observe({ stage }, durationMs);

    // SLA checks
    const thresholds: Record<string, number> = {
      scan: 50,
      classify: 100,
      fill: 100,
      total: 250,
    };

    if (thresholds[stage] && durationMs > thresholds[stage]) {
      this.slaViolations.inc({ operation: stage, threshold_ms: String(thresholds[stage]) });
    }
  }
}
```

### Alert Rules

```yaml
# prometheus/rules/autofill-alerts.yml
groups:
  - name: autofill.performance
    rules:
      - alert: FillExecutionSLAViolation
        expr: |
          histogram_quantile(0.95,
            rate(autofill_fill_duration_ms_bucket{stage="total"}[5m])
          ) > 250
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Form fill P95 exceeds 250ms SLA"
          description: "P95 fill time is {{ $value }}ms"

      - alert: HighFillFailureRate
        expr: |
          rate(autofill_fill_total{status="failed"}[5m]) /
          rate(autofill_fill_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Fill failure rate exceeds 5%"

      - alert: LowCacheHitRate
        expr: |
          rate(autofill_cache_hits_total[5m]) /
          (rate(autofill_cache_hits_total[5m]) + rate(autofill_cache_misses_total[5m])) < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below 70%"

  - name: autofill.infrastructure
    rules:
      - alert: ServiceDown
        expr: up{job=~"auth-service|profile-service|form-service|ai-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"

      - alert: HighMemoryUsage
        expr: |
          container_memory_usage_bytes{namespace="autofill-prod"} /
          container_spec_memory_limit_bytes{namespace="autofill-prod"} > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Memory usage above 85% for {{ $labels.container }}"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL connection pool near exhaustion"
```

---

## 📊 Performance Budget Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE BUDGET                                   │
├─────────────────────────┬──────────────┬──────────────┬────────────────────┤
│ Operation               │ Target       │ P95 Budget   │ Monitoring         │
├─────────────────────────┼──────────────┼──────────────┼────────────────────┤
│ Form Initial Scan       │ < 50ms       │ 45ms         │ Prometheus + Alert │
│ Field Classification    │ < 100ms      │ 80ms         │ Prometheus + Alert │
│ Autofill Execution      │ < 100ms      │ 90ms         │ Prometheus + Alert │
│ Total E2E               │ < 250ms      │ 220ms        │ Prometheus + Alert │
│ API Response (P99)      │ < 200ms      │ 180ms        │ Prometheus + Alert │
│ Cache Hit Rate          │ > 80%        │ 85%          │ Grafana Dashboard  │
│ AI Classification       │ > 90%        │ 92%          │ Custom Metrics     │
│ System Uptime           │ 99.9%        │ 99.95%       │ Uptime Robot       │
└─────────────────────────┴──────────────┴──────────────┴────────────────────┘
```

---

> **📌 หมายเหตุ:** Architecture นี้ออกแบบสำหรับ Production-ready Enterprise deployment บน GitLab namespace `PSA_online` สามารถเริ่ม implement ได้ทันทีโดยสร้าง repository ใน group [PSA_online](https://gitlab.com/groups/psa_online) และใช้ `.gitlab-ci.yml` ที่ระบุไว้สำหรับ CI/CD pipeline อัตโนมัติ
