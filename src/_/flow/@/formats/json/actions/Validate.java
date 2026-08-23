

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

package com.metreeca.flow.json.actions;

import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;

import java.net.URI;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;

import static java.lang.String.format;
import static java.util.Objects.requireNonNull;

/**
 * Model-based value validation.
 *
 * <p>{@linkplain com.metreeca.mesh.Value#validate() Validates} JSON-LD objects against their expected
 * shape.</p>
 */
public final class Validate<V extends Valuable> implements Function<V, Optional<V>> {

    private final Logger logger=service(logger());


    @Override
    public Optional<V> apply(final V value) {

        if ( value == null ) {
            throw new NullPointerException("null value");
        }

        final Value effective=requireNonNull(value.toValue(), "null supplied value");

        final URI id=effective.id().orElse(URI.create("?"));

        return effective.validate()

                .map(trace -> {

                    logger.warning(this, () -> format("%s %s", id, trace));

                    return Optional.<V>empty();

                })

                .orElseGet(() -> {

                    logger.info(this, () -> format("%s {}", id));

                    return Optional.of(value);

                });
    }

}
