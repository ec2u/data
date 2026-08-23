/*
 * Copyright © 2013-2025 Metreeca srl
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

package com.metreeca.flow.gcp.services;

import com.metreeca.flow.services.Vault;

import com.google.cloud.secretmanager.v1.*;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.function.Function;

import static com.metreeca.flow.gcp.GCPServer.project;

import static java.util.stream.StreamSupport.stream;


/**
 * Google Cloud secret vault.
 *
 * <p>Retrieves secrets managed by the Google Cloud Platform secret manager service.</p>
 *
 * <p><strong>Warning</strong> / Only letters, numbers, underscores and hyphens are supported in secret {@linkplain
 * #get(String) ids}.</p>
 *
 * @see <a href="https://cloud.google.com/secret-manager/docs">Google Cloud Plaform - Secret Manager</a>
 */
public final class GCPVault implements Vault, AutoCloseable {

    private final SecretManagerServiceClient client;


    /**
     * Creates a new Google Cloud secret vault.
     */
    public GCPVault() {
        try {

            this.client=SecretManagerServiceClient.create();

        } catch ( final IOException e ) {
            throw new UncheckedIOException(e);
        }
    }


    @Override public String get(final String id, final Function<String, String> fallback) {

        if ( id == null ) {
            throw new NullPointerException("null id");
        }

        if ( id.isEmpty() ) {
            throw new IllegalArgumentException("empty parameter id");
        }

        if ( fallback == null ) {
            throw new NullPointerException("null fallback");
        }

        final String project=project();
        final Iterable<Secret> secrets=client.listSecrets(ProjectName.of(project)).iterateAll();

        if ( stream(secrets.spliterator(), false).anyMatch(secret ->
                SecretName.parse(secret.getName()).getSecret().equals(id)
        ) ) {

            final AccessSecretVersionRequest request=AccessSecretVersionRequest.newBuilder()
                    .setName(SecretVersionName.of(project, id, "latest").toString())
                    .build();

            return client.accessSecretVersion(request).getPayload().getData().toStringUtf8();

        } else {

            return fallback.apply(id);

        }
    }

    @Override public void close() {
        client.close();
    }

}
