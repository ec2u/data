# syntax=docker/dockerfile:1
#
# Copyright © 2020-2026 EC2U Alliance
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# One image per service, selected with --target server|loader

FROM node:24-alpine AS build

WORKDIR /data

COPY package.json package-lock.json ./
COPY --parents packages/*/package.json ./

RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY packages ./packages

RUN npm run build


FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /data

COPY --from=build /data/package.json /data/package-lock.json ./
COPY --from=build --parents /data/./packages/*/package.json ./

COPY --from=build /data/packages/_/lib ./packages/_/lib
COPY --from=build /data/packages/shared/lib ./packages/shared/lib


FROM runtime AS server

RUN npm ci --omit=dev --workspace=@ec2u/data-server && npm cache clean --force

COPY --from=build /data/packages/server/lib ./packages/server/lib

USER node

CMD ["node", "packages/server/lib/index.js"]


FROM runtime AS loader

RUN npm ci --omit=dev --workspace=@ec2u/data-loader && npm cache clean --force

COPY --from=build /data/packages/loader/lib ./packages/loader/lib

RUN chown node:node . # the file cache of fetched pages is created under the working directory

USER node

CMD ["node", "packages/loader/lib/index.js"]

