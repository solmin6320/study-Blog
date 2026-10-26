---
id: 2026-10-27-spring-container
title: Spring Container
summary: "Spring Container는 무엇일까?"
created: 2026-10-27T00:43:34+09:00
updated: 2026-10-27T00:43:34+09:00
tags: [Spring]
category: spring-core
pinned: false
---

## Spring Container

> Spring Bean을 **생성하고, 의존관계를 구성하고, 초기화와 조회 등의 관리를 담당**하는 핵심 구조

-**BeanFactory**-

> Spring의 Bean 생성 및 조회 기능을 정의하는 **인터페이스**

- Bean을 이름이나 타입으로 조회
- Bean 생성과 의존관계 구성을 위한 기본 기능을 제공
- 다른 Spring 구성 요소와 연결되는 기반

예시 코드
```java
UserService userService = beanFactory.getBean(UserService.class)
```
 BeanFactory 계열의 객체에서 UserService 타입의 Bean을 조회하는 예시

- BeanFactory는 인터페이스 이므로 구현체가 필요함

-**대표 구현체**-
> DefaultListableBeanFactory

- Bean 정의를 등록, 조회, 생성, 구성 하는데 필요한 기능을 제공

-**ApplicationContext**-

> **BeanFactory의 기본 기능을 포함**하면서 애플리케이션에 필요한 추가 기능을 제공

- BeanFactory 기능을 바탕으로 한 Bean 관리
- Bean 후처리기와 설정 후처리기 등의 자동 등록 및 처리 과정
- 애플리케이션 이벤트 발행
- 리소스 접근 기능

> ApplicationContext 또한 **인터페이스**

> **인터페이스 관계**로 보면 ApplicationContext는 BeanFactory의 **기능을 상속**

---
## 메모리 내부

> 운영체제 -> JVM 프로세스 -> Spring Boot 애플리케이션 -> ApplicationContext 구현 객체 -> BeanFactory 기능을 제공하는 내부 구성 요소

```java
ApplicationContext context = SpringApplication.run(Application.class, args);
```
변수의 선언 타입은 `ApplicationContext`지만 실제로 반환되는 것은 **구현 객체**

> context 변수 -> 객체 참조 -> 실제 ApplicationContext 구현 객체 -> BeanFactory 기능을 통해 Bean들을 관리, 조회

- 즉, 메모리에 존재하는 것은 실제 객체
- **BeanFactory**와 **ApplicationContext**는 그 객체가 제공하는 **기능을 표현하는 인터페이스**

---
## 역할

-**BeanFactory의 역할**-

> Bean을 생성하고 의존관계를 구성하며 조회할 수 있도록 하는 **기본 추상화(인터페이스)**

-**ApplicationContext의 역할**-

> BeanFactory의 핵심 Bean 기능에 애플리케이션에 필요한 **추가 기능을 통합**

---
## 코드
