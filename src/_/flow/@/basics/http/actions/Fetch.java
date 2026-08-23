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

package com.metreeca.flow.http.actions;


import com.metreeca.flow.Locator;
import com.metreeca.flow.actions.Limit;
import com.metreeca.flow.http.Message;
import com.metreeca.flow.http.Request;
import com.metreeca.flow.http.Response;
import com.metreeca.flow.http.services.Fetcher;
import com.metreeca.flow.services.Logger;

import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;


/**
 * Resource fetching.
 *
 * <p>Maps resource requests to optional responses.</p>
 *
 * <p><strong>Warning</strong> / Fetch client must configure request payloads through the
 * {@link Message#output(Consumer)} method.</p>
 */
public final class Fetch implements Function<Request, Optional<Response>> {

    private Function<Request, Request> limit=new Limit<>(0);

    private Fetcher fetcher=Locator.service(Fetcher.fetcher());


    private final Logger logger=Locator.service(Logger.logger());


    /**
     * Configures the rate limit (default to no limit)
     *
     * @param limit the request processing rate limit
     *
     * @return this action
     *
     * @throws NullPointerException if {@code limit} is null
     */
    public Fetch limit(final Function<Request, Request> limit) {

        if ( limit == null ) {
            throw new NullPointerException("null limit");
        }

        this.limit=limit;

        return this;
    }

    /**
     * Configures the resource fetcher (defaults to the {@linkplain Fetcher#fetcher() shared resource fetcher})
     *
     * @param fetcher the resource fetcher
     *
     * @return this action
     *
     * @throws NullPointerException if {@code fetcher} is null
     */
    public Fetch fetcher(final Fetcher fetcher) {

        if ( fetcher == null ) {
            throw new NullPointerException("null fetcher");
        }

        this.fetcher=fetcher;

        return this;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Fetches a resource.
     *
     * @param request the request to be used for fetching the request; ignored if null
     *
     * @return an optional response, if the {@code request} was not null and successfully processed; an empty optional,
     * otherwise, logging an error to the {@linkplain Logger#logger() shared event logger}
     */
    @Override public Optional<Response> apply(final Request request) {
        return Optional

                .ofNullable(request)

                .map(limit)
                .map(fetcher)

                .filter(response -> {

                    final boolean success=response.success();

                    if ( !success ) {

                        logger.warning(this, String.format("%d %s", response.status(), response.item()));

                    }

                    return success;

                });
    }

}
