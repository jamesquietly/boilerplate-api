## Project setup

```bash
$ pnpm install
$ docker compose up -d
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

Needs a registry to push the image to like AWS ECR, Docker Hub, etc.

```bash
$ docker build --build-arg NODE_ENV=production -t boilerplate-api:1.0.0 .
$ docker tag boilerplate-api:1.0.0 yourregistry/boilerplate-api:1.0.0
$ docker push yourregistry/boilerplate-api:1.0.0
```

## Test docker-compose.prod.yml

Test the production docker image locally, builds NestJS and Postgres containers specified in `docker-compose.prod.yml`

```bash
$ docker compose -f docker-compose.prod.yml up -d
```
