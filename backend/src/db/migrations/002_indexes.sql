create index if not exists idx_enrollments_unit on enrollments(unit_id);
create index if not exists idx_availability_user on availability_slots(user_id);
create index if not exists idx_requests_to on match_requests(to_user_id);
create index if not exists idx_feedback_to on feedback(to_user_id);
create index if not exists idx_notifications_user on notifications(user_id);
