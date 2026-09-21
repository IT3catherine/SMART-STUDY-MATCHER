insert into units (id, code, name, department) values
('11111111-1111-1111-1111-111111111111', 'COMP101', 'Programming Fundamentals', 'Computer Science'),
('22222222-2222-2222-2222-222222222222', 'COMP202', 'Data Structures & Algorithms', 'Computer Science'),
('33333333-3333-3333-3333-333333333333', 'COMP301', 'Database Systems', 'Computer Science'),
('44444444-4444-4444-4444-444444444444', 'COMP305', 'Web Development', 'Computer Science'),
('55555555-5555-5555-5555-555555555555', 'COMP401', 'Artificial Intelligence', 'Computer Science'),
('66666666-6666-6666-6666-666666666666', 'COMP402', 'Machine Learning', 'Computer Science'),
('77777777-7777-7777-7777-777777777777', 'COMP210', 'Computer Architecture', 'Computer Science'),
('88888888-8888-8888-8888-888888888888', 'COMP220', 'Operating Systems', 'Computer Science'),
('99999999-9999-9999-9999-999999999999', 'COMP315', 'Software Engineering', 'Computer Science'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'COMP350', 'Computer Networks', 'Computer Science'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'COMP450', 'Cybersecurity', 'Computer Science'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'COMP490', 'Advanced Cloud Computing', 'Computer Science')
on conflict (id) do nothing;
