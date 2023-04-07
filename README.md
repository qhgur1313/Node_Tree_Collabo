# Node Tree Maker

## 프로젝트 목적
노드트리를 편집하고, 해당 노드트리를 시각화해주는 토이 프로젝트입니다.  
이 프로젝트는 웹소켓을 통해 여러 유저가 접속하여 동일한 화면을 볼 수 있게 하며, 동시 편집 상황에서 발생하는 커맨드 충돌을 해결하는 로직이 포함되어 있습니다.

## 프로젝트 설명
접속한 클라이언트마다 추가한 노드가 다른 색깔로 보여지며, 부모자식 관계는 선으로 이어져있습니다.  
각 노드는 id를 가지고, 원 내부에 자신의 id를 보여주게 되어있습니다.  
<img width="1912" alt="image" src="https://user-images.githubusercontent.com/86861280/230520456-abfe96f5-23e9-46ef-bee1-c9f12648b62a.png">


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

## Command 동작 방법
- 자식 노드 추가는 특정 노드를 마우스 좌클릭 할 경우 해당 노드의 last child로 새로운 노드가 추가됩니다.
- 노드 삭제는 노드를 마우스 우클릭 할 경우 삭제됩니다.
- Undo/Redo가 가능합니다.
- 두개의 클라이언트를 켜놓고, 자동으로 랜덤한 동작을 원할 경우 우측 상단의 자동 동작 시작을 누르면 됩니다.
  - 랜덤한 동작 종류 : 추가, 삭제, Undo, Redo
- 자동 동작 행위의 텀을 변경하고 싶으신 경우 Page.tsx파일의 randamBehaviorTerm을 변경하시면 됩니다. 
