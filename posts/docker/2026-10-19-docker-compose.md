---
id: 2026-10-19-docker-compose
title: Docker Compose
summary: "Docker Compose가 무엇인가?"
created: 2026-10-19T19:50:56+09:00
updated: 2026-10-19T19:50:56+09:00
tags: [Docker]
category: docker
pinned: false
---

## Docker Compose

> 여러 컨테이너로 구성된 애플리케이션을 하나의 yaml 설정 파일로 정의 하고 통합 관리하는 도구

-**Docker Compose가 없을 때**-

> 이미지 지정 -> 포트 설정 -> 환경변수 전달 -> 컨테이너 실행

- 각 컨테이너를 개별적으로 실행하고 필요한 설정을 일관되게 관리
- 컨테이너가 여러 개일수록 실행 명령어와 설정을 관리하기 복잡함

-**Docker Compose** 사용-

> compose.yml에 각 서비스의 실행 설정을 작성 -> docker compose up -> 필요한 컨테이너와 네트워크 등을 생성 및 실행

---
## 실행 및 메모리 구조

> docker compose up -> Docker Compose CLI - 설정 구성, 환경변수 치환 -> Docker Engine API -> Docker Engine . . .

-**알아야할 기본 특징**-

- Container: 애플리케이션 프로세스가 격리된 환경에서 실행되는 공간
- Volume: 컨테이너의 수명과 분리하여 데이터를 유지할 수 있는 저장 공간

---
## 역할

여러 서비스의 실행 구성을 코드로 정의하고, 그 구성에 따라 애플리케이션 전체를 관리하는 것

1. 여러 서비스 관리 - 이미지, 설정 등
2. 네트워크 관리 - Docker 내부 DNS 등
3. 데이터 저장 공간 관리 - Volume 기능 등

---
## 코드

```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"

    environment:
      SPRING_DATASOURCE_URL: jdbc:mariadb://db:3306/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}

    depends_on:
      db:
        condition: service_healthy

  db:
    image: mariadb:11.4

    environment:
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}

    volumes:
      - mariadb_data:/var/lib/mysql

    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

volumes:
  mariadb_data:
```
-**service**-
```yaml
services:
  app:
  db:
```
- 함께 실행할 서비스를 정의하는 최상위 항목
- app, db는 서비스 이름
- 서비스별로 이미지, 빌드 방법, 환경변수 등을 지정

```yaml
app:
  build: .
```

- 현재 디렉토리를 빌드 컨텍스트로 지정
- 해당 디렉토리의 Dockerfile로 Spring Boot 이미지를 빌드하도록 설정

```yaml
db:
  image: mariadb:11.4
```

- MariaDB 이미지를 기반으로 데이터베이스 컨테이너를 실행

```yaml
ports:
  - "8080:8080"
```
- 왼쪽 8080: 호스트에서 접근할 포트
- 오른쪽 8080: 컨테이너 내부의 포트

```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:mariadb://db:3306/${DB_NAME}
  SPRING_DATASOURCE_USERNAME: ${DB_USER}
  SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
```

- 컨테이너에 전달할 환경변수를 설정
- Compose가 `${DB_NAME}` 등의 표현식을 .env에서 읽은 값으로 치환

```yaml
depends_on:
  db:
    condition: service_healthy
```
- app 서비스가 db 서비스에 의존함을 선언
- service_healthy를 사용하여 DB의 health check가 성공한 뒤 app 서비스가 시작되도록 설정

```yaml
healthcheck:
  test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 20s
```

- test: 실행할 상태 확인 명령어
- interval: 상태 확인 간격
- timeout: 상태 확인 명령의 제한 시간
- retries: 실패를 허용하는 횟수
- start_period: 컨테이너 시작 직후 상태 확인을 위한 초기 유에 시간

```yaml
volumes:
  - mariadb_data:/var/lib/mysql
```

- mariadb_data: Docker가 관리하는 명명된 볼륨
- /var/lib/mysql: MariaDB 컨테이너에서 데이터 파일을 저장하는 디렉토리

---
## 전체 흐름

1. JAR 파일 생성
2. Compose 설정 확인
3. 컨테이너 생성 및 실행
4. 실행 상태 및 로그 확인
5. 종료

-주의할점-
`docker compose down -v` 처럼 -v가 들어간 명령어는 Compose 파일에 선언된 명명된 **볼륨도 제거** 대상이 됨

---
## 핵심 정리 및 배운점

> compose.yaml에 여러 서비스의 실행 설정을 선언하고 Docker Engine을 통해 애플리케이션을 관리하는 도구

> compose.yaml -> Docker Compose CLI -> Docker Engine API -> Docker Engine . . .

- Compose는 컨테이너를 하나씩 실행하는 복잡한 과정을 **설정 파일로 관리**
- **컨테이너와 데이터의 수명은 다름**(볼륨을 유지하면 데이터를 보존할 수  있음)

> compose.yaml 작성 -> docker compose up -> 이미지 빌드, 다운로드 -> 컨테이너, 네트워크, 볼륨 구성 -> 서비스 실행 및 통신
