insert into units (id, code, name, department) values
('11111111-1111-1111-1111-111111111111', 'COMP101', 'Programming Fundamentals', 'Computer Science'),
('22222222-2222-2222-2222-222222222222', 'COMP202', 'Data Structures', 'Computer Science'),
('33333333-3333-3333-3333-333333333333', 'MATH101', 'Calculus I', 'Mathematics'),
('44444444-4444-4444-4444-444444444444', 'STAT201', 'Statistics', 'Mathematics')
on conflict (id) do nothing;
