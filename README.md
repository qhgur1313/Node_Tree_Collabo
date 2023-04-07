# Node Tree Maker

## 프로젝트 목적
노드트리를 편집하고, 해당 노드트리를 시각화해주는 토이 프로젝트입니다. 이 프로젝트는 웹소켓을 통해 여러 유저가 접속하여 동일한 화면을 볼 수 있게 하며, 동시 편집 상황에서 발생하는 커맨드 충돌을 해결하는 로직이 포함되어 있습니다.

## 구축 환경
- Client : React + Typescript
- Server : express + Typescript
- server와 client 모두 해당
- node version : 16.13.2
- npm version : 8.1.2

## 사용 방법

1. 아래 커맨드 수행

```
cd client
npm install
cd ..
cd server
npm install
docker-compose up
```

2. localhost:3000으로 접속한다.
3. 두개 이상의 창을 켜서, 노드 삭제/추가를 동작해본다.
