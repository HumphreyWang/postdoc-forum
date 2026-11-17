.PHONY: install dev build start typecheck test
install:
	npm ci
dev:
	npm run dev
build:
	npm run build
start:
	npm start
typecheck:
	npm run typecheck
test:
	npm run test:smoke
