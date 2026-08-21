-- 기존 분류 중 '번역·검토', '기획·아이디어', '자동화·개발'은 신규 분류와
-- 일대일로 대응하지 않으므로 각각 '번역·교정', '작성·요약', '분석·진단'으로 기본 매핑한다.

-- 1. 기존 에이전트의 카테고리를 신규 5종 체계로 재매핑한다.
UPDATE "Agent"
SET "category" = CASE "category"
    WHEN '조사·리서치' THEN '조사·수집'
    WHEN '분석' THEN '분석·진단'
    WHEN '번역·검토' THEN '번역·교정'
    WHEN '기획·아이디어' THEN '작성·요약'
    WHEN '자동화·개발' THEN '분석·진단'
    ELSE "category"
END
WHERE "category" IN ('조사·리서치', '분석', '번역·검토', '기획·아이디어', '자동화·개발');

-- 2. 신규 카테고리를 멱등하게 추가하고 표시 순서를 정합화한다.
INSERT INTO "Category" ("id", "name", "order")
VALUES
    ('cat_research', '조사·수집', 0),
    ('cat_write', '작성·요약', 1),
    ('cat_translate', '번역·교정', 2),
    ('cat_analyze', '분석·진단', 3),
    ('cat_verify', '점검·대조', 4)
ON CONFLICT ("name") DO UPDATE
SET "order" = EXCLUDED."order";

-- 3. 신규 5종에 포함되지 않는 이전 카테고리 행을 제거한다.
DELETE FROM "Category"
WHERE "name" NOT IN ('조사·수집', '작성·요약', '번역·교정', '분석·진단', '점검·대조');
