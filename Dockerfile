# 로컬 에디터 서버 (docs/api.md). 공개 사이트(GitHub Pages)와 무관 — 글을 추가할 때만 켠다.
FROM python:3.12-slim

# git: 헬스의 branch·dirty, 저장 뒤 자동 커밋, 그리고 자동 푸시(HTTPS)에 쓴다.
# ca-certificates: 푸시가 https://github.com 인증서를 검증하는 데 필요하다(--no-install-recommends라 git이 끌고 오지 않는다).
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 1000 blog

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    BLOG_BIND=0.0.0.0 \
    BLOG_PORT=5500

COPY server/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# 코드는 이미지에 굽지 않는다 — docker-compose.yml 이 프로젝트 루트를 /app 에 마운트한다.
WORKDIR /app
USER blog
EXPOSE 5500
CMD ["python", "-m", "server.app"]
