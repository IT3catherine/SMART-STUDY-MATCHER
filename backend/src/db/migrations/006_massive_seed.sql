-- 006_massive_seed.sql

DO $$
DECLARE
    i INT;
    j INT;
    new_user_id UUID;
    
    -- We will dynamically load all available units into this array
    all_units UUID[];
    total_units INT;
    rnd_other_unit UUID;
    
    current_unit RECORD;
    
    learning_styles TEXT[] := ARRAY['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'];
    collab_modes TEXT[] := ARRAY['online', 'physical', 'hybrid'];
BEGIN
    -- Fetch all existing units from the database so we catch literally every single one!
    SELECT array_agg(id) INTO all_units FROM units;
    total_units := array_length(all_units, 1);

    -- If there are no units, we can't seed matches
    IF total_units IS NULL OR total_units = 0 THEN
        RETURN;
    END IF;

    -- Loop through EVERY SINGLE unit in the database ensuring none is missed
    FOR current_unit IN SELECT id, code FROM units LOOP
        
        -- Generate 25 totally unique dummy students specifically for THIS unit
        FOR j IN 1..25 LOOP
            new_user_id := gen_random_uuid();
            
            -- Insert user (password is 'password' hashed)
            INSERT INTO users (id, name, email, password_hash, role)
            VALUES (
                new_user_id,
                'Student ' || current_unit.code || ' #' || j,
                'dummy_' || current_unit.code || '_' || j || '@test.com',
                '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa31lW',
                'STUDENT'
            );

            -- Insert profile
            INSERT INTO student_profiles (user_id, program, year, learning_style, goals, bio, collaboration_mode, location, contact_pref, is_active)
            VALUES (
                new_user_id,
                'Computer Science',
                (1 + (j % 4))::TEXT,
                learning_styles[1 + (j % 4)],
                '["Pass Exams", "Learn new skills", "Group Study"]'::jsonb,
                'I am a generic student looking for partners in ' || current_unit.code,
                collab_modes[1 + (j % 3)],
                'Library',
                'email',
                true
            );

            -- Enroll them in the current unit (GUARANTEEING 25 matches per unit)
            INSERT INTO enrollments (id, user_id, unit_id, role)
            VALUES (gen_random_uuid(), new_user_id, current_unit.id, 'STUDENT');

            -- Enroll them in a 2nd random unit just for variety
            rnd_other_unit := all_units[1 + ((j + floor(random() * total_units))::INT % total_units)];
            IF rnd_other_unit != current_unit.id THEN
                INSERT INTO enrollments (id, user_id, unit_id, role)
                VALUES (gen_random_uuid(), new_user_id, rnd_other_unit, 'STUDENT')
                ON CONFLICT (user_id, unit_id) DO NOTHING;
            END IF;

            -- Insert guaranteed availabilities (so schedules will definitely overlap)
            -- Morning slot
            INSERT INTO availabilities (user_id, day_of_week, start_time, end_time)
            VALUES (new_user_id, 1, '09:00:00', '12:00:00');
            
            -- Afternoon slot
            INSERT INTO availabilities (user_id, day_of_week, start_time, end_time)
            VALUES (new_user_id, 3, '13:00:00', '16:00:00');

            -- Night slot
            INSERT INTO availabilities (user_id, day_of_week, start_time, end_time)
            VALUES (new_user_id, 5, '18:00:00', '21:00:00');

        END LOOP;
        
    END LOOP;
END $$;
