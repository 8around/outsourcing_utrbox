-- RPC 함수: 일치 판정받은 분석 완료 콘텐츠 개수 조회
-- admin_review_status='match'인 detected_contents를 가진, is_analyzed=true인 contents의 개수를 반환
CREATE OR REPLACE FUNCTION get_matched_analyzed_contents_count(user_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(DISTINCT c.id)::INTEGER
  FROM contents c
  INNER JOIN detected_contents dc ON c.id = dc.content_id
  WHERE c.user_id = user_id_param
    AND c.is_analyzed = true
    AND dc.admin_review_status = 'match'
$$ LANGUAGE SQL STABLE;
