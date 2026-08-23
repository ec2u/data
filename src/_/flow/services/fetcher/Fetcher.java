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

package com.metreeca.flow.http.services;

import com.metreeca.flow.http.Message;
import com.metreeca.flow.http.Request;
import com.metreeca.flow.http.Response;
import com.metreeca.flow.services.Cache;
import com.metreeca.flow.services.Logger;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.zip.GZIPInputStream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Request.GET;
import static com.metreeca.flow.http.Response.*;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.Pipes.data;

import static java.lang.Integer.max;
import static java.lang.Integer.min;
import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Arrays.asList;


/**
 * Resource fetcher.
 *
 * <p>Fetches external resources through system-specific facilities.</p>
 *
 * <p><strong>Warning</strong> / Fetcher implementations must retrieve request payloads through the
 * {@link Message#output()} method.</p>
 */
@FunctionalInterface
public interface Fetcher extends Function<Request, Response> {

    /**
     * Retrieves the default resource fetcher factory.
     *
     * @return the default resource fetcher factory, which creates {@link URLFetcher} instances
     */
    public static Supplier<Fetcher> fetcher() {
        return URLFetcher::new;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * URL resource fetcher.
     *
     * <p>Fetches external resources through the {@link URL#openConnection()} API.</p>
     */
    public static class URLFetcher implements Fetcher {

        private static final String AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                +" AppleWebKit/537.36 (KHTML, like Gecko)"
                +" Chrome/135.0.0.0"
                +" Safari/537.36";

        private final Logger logger=service(logger());


        @Override
        public Response apply(final Request request) {
            return switch ( request.item().substring(0, max(0, request.item().indexOf(':'))) ) {
                case "http", "https" -> http(request);
                default -> wild(request);
            };
        }


        private Response http(final Request request) { // !!! migrate to HttpClient
            try {

                final Collection<URI> visited=new HashSet<>();

                for (URI resource=new URI(request.resource()); visited.add(resource); ) {

                    final String method=request.method();

                    logger.info(this, format("%s %s", method, resource));

                    final HttpURLConnection connection=(HttpURLConnection)resource.toURL().openConnection();

                    connection.setRequestMethod(method);
                    connection.setDoOutput(method.equals(Request.POST) || method.equals(Request.PUT));

                    connection.setInstanceFollowRedirects(true);

                    // !!! connection.setConnectTimeout();
                    // !!! connection.setReadTimeout();
                    // !!! connection.setIfModifiedSince();

                    if ( request.header("User-Agent").isEmpty() ) {
                        connection.setRequestProperty("User-Agent", AGENT);
                    }

                    if ( request.header("Accept-Encoding").isEmpty() ) {
                        connection.addRequestProperty("Accept-Encoding", "gzip");
                    }

                    if ( request.header("Accept").isEmpty() ) {
                        connection.addRequestProperty("Accept", "text/html,"
                                +"application/xhtml+xml,"
                                +"application/xml;q=0.9;"
                                +"*/*;q=0.1"
                        );
                    }

                    request.headers().forEach(connection::addRequestProperty);

                    connection.connect();

                    if ( connection.getDoOutput() ) {

                        try ( final OutputStream output=connection.getOutputStream() ) {

                            request.output().accept(output);

                        } catch ( final IOException e ) {

                            throw new UncheckedIOException(e);

                        }

                    }

                    final boolean head=connection.getRequestMethod().equalsIgnoreCase(Request.HEAD);
                    final int code=connection.getResponseCode(); // !!! handle http > https redirection
                    final String encoding=connection.getContentEncoding();

                    switch ( code ) {

                        // handle http/https redirections

                        case MOVED_PERMANENTLY, FOUND, SEE_OTHER, TEMPORARY_REDIRECT, PERMANENT_REDIRECT -> {

                            final String location=connection.getHeaderField("Location");

                            if ( location == null ) {
                                return request.reply(INTERNAL_SERVER_ERROR, "Missing Location Header");
                            }

                            resource=resource.resolve(URLDecoder.decode(location, UTF_8));

                        }

                        // reply

                        default -> {

                            final String location=resource.toString();

                            return request.reply(min(max(100, code), 599)) // harden against illegal codes

                                    .map(response -> {

                                        connection.getHeaderFields().forEach((name, values) -> {

                                            // ;( name may use null to hold status line

                                            if ( name != null && !name.equalsIgnoreCase("Set-Cookie") ) {
                                                response.headers(name, values);
                                            }

                                            // record the effective retrieval location

                                            response.header("Content-Location",
                                                    response.header("Content-Location").orElse(location)
                                            );

                                        });

                                        return response;
                                    })

                                    .input(() -> {
                                        try {

                                            return Optional

                                                    .ofNullable(head ? null
                                                            : code/100 == 2 ? connection.getInputStream()
                                                            : connection.getErrorStream()
                                                    )

                                                    .map(input -> {
                                                        try {

                                                            return "gzip".equals(encoding)
                                                                    ? new GZIPInputStream(input)
                                                                    : input;

                                                        } catch ( final IOException e ) {
                                                            throw new UncheckedIOException(e);
                                                        }
                                                    })

                                                    .orElseGet(InputStream::nullInputStream);

                                        } catch ( final IOException e ) {
                                            throw new UncheckedIOException(e);
                                        }
                                    });

                        }
                    }

                }

                return request.reply(508, "Redirection Loop Detected");

            } catch ( final URISyntaxException e ) {

                return request.reply(BAD_REQUEST, format("malformed request URI <%s>", request.resource()));

            } catch ( final IOException e ) {

                return request.reply(INTERNAL_SERVER_ERROR, "I/O Error");

            }

        }

        private Response wild(final Request request) {

            final String method=request.method();
            final String resource=request.resource();

            if ( method.equals(GET) ) {

                logger.info(this, format("%s %s", method, resource));

                return new Response(request)

                        .status(Response.OK)

                        .input(() -> {
                            try {

                                final InputStream input=new URI(resource).toURL().openStream();

                                return resource.endsWith(".gz")
                                        ? new GZIPInputStream(input)
                                        : input;


                            } catch ( final URISyntaxException e ) {

                                throw new IllegalArgumentException(e);

                            } catch ( final IOException e ) {

                                throw new UncheckedIOException(e);

                            }
                        });

            } else {

                return request.reply(METHOD_NOT_ALLOWED);

            }
        }

    }

    /**
     * Caching resource fetcher.
     *
     * <p>Caches resources fetched by a delegate fetcher.</p>
     */
    public static final class CacheFetcher implements Fetcher {

        private final Set<String> ignored=new HashSet<>(set("file:"));


        private Fetcher delegate=service(fetcher(), fetcher());
        private Cache cache=service(Cache.cache());


        /**
         * Configures the delegate for this fetcher (defaults to the {@linkplain #fetcher() shared fetcher service}).
         *
         * @param delegate the delegate for this fetcher
         *
         * @return this fetcher
         *
         * @throws NullPointerException if {@code delegate} is null
         */
        public CacheFetcher delegate(final Fetcher delegate) {

            if ( delegate == null ) {
                throw new NullPointerException("null delegate");
            }

            this.delegate=delegate;

            return this;
        }

        /**
         * Configures the cache for this fetcher (defaults to the {@link Cache#cache() shared cache}).
         *
         * @param cache the cache for this fetcher
         *
         * @return this fetcher
         *
         * @throws NullPointerException if {@code cache} is null
         */
        public CacheFetcher cache(final Cache cache) {

            if ( cache == null ) {
                throw new NullPointerException("null cache");
            }

            this.cache=cache;

            return this;
        }


        /**
         * Configures resource paths to be ignored by the cache.
         *
         * <p>Resources matching the specified path prefixes will be fetched directly
         * without caching. Path prefixes must end with either ":" (for schemes) or "/" (for path prefixes).</p>
         *
         * @param paths the path prefixes to ignore
         *
         * @return this fetcher
         *
         * @throws NullPointerException     if {@code paths} is null or contains null elements
         * @throws IllegalArgumentException if any path doesn't end with ":" or "/"
         */
        public CacheFetcher ignore(final String... paths) {

            if ( paths == null || Arrays.stream(paths).anyMatch(Objects::isNull) ) {
                throw new NullPointerException("null paths");
            }

            return ignore(asList(paths));
        }

        /**
         * Configures resource paths to be ignored by the cache.
         *
         * <p>Resources matching the specified path prefixes will be fetched directly
         * without caching. Path prefixes must end with either ":" (for schemes) or "/" (for path prefixes).</p>
         *
         * @param paths the path prefixes to ignore
         *
         * @return this fetcher
         *
         * @throws NullPointerException     if {@code paths} is null or contains null elements
         * @throws IllegalArgumentException if any path doesn't end with ":" or "/"
         */
        public CacheFetcher ignore(final Collection<String> paths) {

            if ( paths == null || paths.stream().anyMatch(Objects::isNull) ) {
                throw new NullPointerException("null paths");
            }

            paths.forEach(path -> {

                if ( !(path.endsWith(":") || path.endsWith("/")) ) {
                    throw new IllegalArgumentException(format("malformed path prefix <%s>", path));
                }

            });

            ignored.addAll(paths);

            return this;
        }


        @Override
        public Response apply(final Request request) {
            return request.safe() && !ignored(request.item()) ? cache.retrieve(

                    format("%s %s", request.method(), request.resource()),

                    input -> decode(request, input),
                    output -> encode(delegate.apply(request), output)

            ) : delegate.apply(request);
        }


        private boolean ignored(final String item) {
            return ignored.stream().anyMatch(item::startsWith);
        }

        private Response encode(final Response response, final OutputStream output) {
            if ( response.success() ) {

                try (
                        final InputStream input=response.input().get();
                        final ObjectOutputStream serialized=new ObjectOutputStream(output)
                ) {

                    final byte[] data=data(input);

                    serialized.writeInt(response.status());
                    serialized.writeObject(response.headers());
                    serialized.writeObject(data);
                    serialized.flush();

                    return response.input(() -> new ByteArrayInputStream(data));

                } catch ( final IOException e ) {

                    throw new UncheckedIOException(e);

                }

            } else {
                return response;
            }
        }

        @SuppressWarnings("unchecked")
        private Response decode(final Request request, final InputStream input) {
            try ( final ObjectInputStream serialized=new ObjectInputStream(input) ) {

                final int status=serialized.readInt();
                final Map<String, String> headers=(Map<String, String>)serialized.readObject();
                final byte[] body=(byte[])serialized.readObject();

                return new Response(request)
                        .status(status)
                        .headers(headers)
                        .input(() -> new ByteArrayInputStream(body));

            } catch ( final ClassNotFoundException unexpected ) {

                throw new RuntimeException(unexpected);

            } catch ( final IOException e ) {

                throw new UncheckedIOException(e);

            }
        }

    }

}
