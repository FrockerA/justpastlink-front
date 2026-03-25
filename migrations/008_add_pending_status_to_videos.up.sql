ALTER TABLE videos DROP CONSTRAINT IF EXISTS chk_videos_status;

ALTER TABLE videos
ADD CONSTRAINT chk_videos_status
CHECK (status IN ('pending', 'uploaded', 'queued', 'processing', 'generating_lecture', 'generating_quiz', 'completed', 'failed'));