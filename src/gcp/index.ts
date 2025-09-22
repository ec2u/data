/*
 * Copyright © 2025 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @module gcp
 *
 * Provides Google Cloud Platform integrations.
 */

import { GoogleAuth } from "google-auth-library";

const auth=new GoogleAuth();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The Google Cloud project ID obtained from the authenticated environment.
 *
 * This value is resolved at module initialization using Google Cloud's default
 * authentication flow, which checks for credentials in the following order:
 *
 * 1. GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 2. gcloud user credentials
 * 3. Google Cloud metadata service (when running on GCP)
 */
export const project=await auth.getProjectId();
