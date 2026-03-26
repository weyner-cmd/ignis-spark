
-- P0: Foreign Keys for all tables

-- appointments
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_subtenant FOREIGN KEY (sub_tenant_id) REFERENCES sub_tenants(id) ON DELETE CASCADE;

-- sub_tenants
ALTER TABLE sub_tenants ADD CONSTRAINT fk_sub_tenants_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- sacraments
ALTER TABLE sacraments ADD CONSTRAINT fk_sacraments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sacraments ADD CONSTRAINT fk_sacraments_subject FOREIGN KEY (subject_id) REFERENCES people(id) ON DELETE SET NULL;
ALTER TABLE sacraments ADD CONSTRAINT fk_sacraments_celebrant FOREIGN KEY (celebrant_id) REFERENCES people(id) ON DELETE SET NULL;

-- people
ALTER TABLE people ADD CONSTRAINT fk_people_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- staff
ALTER TABLE staff ADD CONSTRAINT fk_staff_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- pastoral_groups
ALTER TABLE pastoral_groups ADD CONSTRAINT fk_pastoral_groups_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- pastoral_members
ALTER TABLE pastoral_members ADD CONSTRAINT fk_pastoral_members_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pastoral_members ADD CONSTRAINT fk_pastoral_members_group FOREIGN KEY (group_id) REFERENCES pastoral_groups(id) ON DELETE CASCADE;
ALTER TABLE pastoral_members ADD CONSTRAINT fk_pastoral_members_person FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;

-- pastoral_events
ALTER TABLE pastoral_events ADD CONSTRAINT fk_pastoral_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pastoral_events ADD CONSTRAINT fk_pastoral_events_group FOREIGN KEY (group_id) REFERENCES pastoral_groups(id) ON DELETE CASCADE;

-- tithes
ALTER TABLE tithes ADD CONSTRAINT fk_tithes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- parish_assets
ALTER TABLE parish_assets ADD CONSTRAINT fk_parish_assets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- profiles
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_subtenant FOREIGN KEY (sub_tenant_id) REFERENCES sub_tenants(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- P0: UNIQUE constraints scoped by tenant_id
CREATE UNIQUE INDEX idx_people_cpf_tenant ON people(tenant_id, cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX idx_pastoral_groups_name_tenant ON pastoral_groups(tenant_id, name);
CREATE UNIQUE INDEX idx_staff_email_tenant ON staff(tenant_id, email) WHERE email IS NOT NULL;
