# Royal Casino

React와 Vite로 만든 카지노 게임 모음입니다.

## 실행

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 터미널에 표시된 로컬 주소를 엽니다.

## 빌드 확인

```bash
npm run build
npm run preview
```

## GitHub 업로드

```bash
git add .
git commit -m "Update project"
git push
```

`node_modules`, `dist`, `.figma`, 환경 변수 파일은 `.gitignore`에 의해 업로드되지 않습니다.

## GitHub Pages

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드하고 배포합니다.

배포 주소: https://kjw12161-wq.github.io/ahffk/

처음 한 번은 GitHub 저장소의 `Settings > Pages`에서 `Source`를 `GitHub Actions`로 선택합니다.
