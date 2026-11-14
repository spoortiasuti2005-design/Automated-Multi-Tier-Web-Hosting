-- PostgreSQL Schema for Automated Multi-Tier Web Application Hosting System
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS server_instances (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    private_ip VARCHAR(32) NOT NULL,
    availability_zone VARCHAR(32) NOT NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'provisioning', 'terminating')),
    cpu_usage NUMERIC(5,2) NOT NULL DEFAULT 0,
    memory_usage NUMERIC(5,2) NOT NULL DEFAULT 0,
    requests_per_min INTEGER NOT NULL DEFAULT 0,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    app_version VARCHAR(32) NOT NULL DEFAULT 'v2.4.0',
    uptime_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    requests_per_min INTEGER NOT NULL,
    avg_cpu NUMERIC(5,2) NOT NULL,
    avg_memory NUMERIC(5,2) NOT NULL,
    active_instances INTEGER NOT NULL,
    avg_response_time_ms INTEGER NOT NULL,
    system_health VARCHAR(24) NOT NULL
);

CREATE TABLE IF NOT EXISTS scaling_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(32) NOT NULL CHECK (action IN ('scale_up', 'scale_down', 'manual_add', 'manual_remove', 'maintain')),
    previous_count INTEGER NOT NULL,
    new_count INTEGER NOT NULL,
    cpu_at_event NUMERIC(5,2) NOT NULL,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(32) NOT NULL,
    commit_sha VARCHAR(16) NOT NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('pending', 'building', 'testing', 'deploying', 'success', 'failed', 'rolled_back')),
    build_status VARCHAR(24) NOT NULL,
    triggered_by VARCHAR(64) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    logs JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category VARCHAR(32) NOT NULL CHECK (category IN ('scaling', 'load_balancer', 'database', 'deployment', 'monitoring', 'security', 'system')),
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    min_instances INTEGER NOT NULL DEFAULT 1,
    max_instances INTEGER NOT NULL DEFAULT 8,
    scale_up_cpu_threshold NUMERIC(5,2) NOT NULL DEFAULT 70.0,
    scale_down_cpu_threshold NUMERIC(5,2) NOT NULL DEFAULT 30.0,
    lb_algorithm VARCHAR(32) NOT NULL DEFAULT 'round_robin',
    cloud_provider VARCHAR(32) NOT NULL DEFAULT 'simulated',
    auto_scaling_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    tick_interval_ms INTEGER NOT NULL DEFAULT 3000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
