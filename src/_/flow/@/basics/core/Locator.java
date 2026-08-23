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

package com.metreeca.flow;


import com.metreeca.flow.services.Logger;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.*;
import java.util.function.Supplier;

import static java.lang.String.format;


/**
 * Service locator {thread-safe}.
 *
 * <p>Manages the lifecycle of shared services.</p>
 */
@SuppressWarnings("unchecked")
public final class Locator implements AutoCloseable {

    private static final ThreadLocal<Locator> SCOPE=new ThreadLocal<>();

    private static final Executor EXECUTOR=Executors.newVirtualThreadPerTaskExecutor();


    /**
     * Retrieves the default base path factory.
     *
     * @return the default base path factory, which returns the path of the current working directory of the process in
     *         the host filesystem
     */
    public static Supplier<Path> path() {
        return () -> Paths.get("").toAbsolutePath();
    }

    /**
     * Retrieves the default scheduler factory.
     *
     * @return the default scheduler factory, which returns a single thread scheduled executor
     */
    public static Supplier<ScheduledExecutorService> scheduler() {
        return Executors::newSingleThreadScheduledExecutor;
    }


    /**
     * {@linkplain #get(Supplier) Retrieves} a shared service from the active locator.
     *
     * @param factory the factory responsible for creating the required shared service; must return a non-null and
     *                thread-safe object
     * @param <T>     the type of the shared service created by {@code factory}
     *
     * @return the shared service created by {@code factory} or by its plugin replacement if one was
     *         {@linkplain #set(Supplier, Supplier) specified}
     *
     * @throws IllegalArgumentException if {@code factory} is null
     * @throws IllegalStateException    if called outside an active locator or a circular service dependency is
     *                                  detected
     */
    public static <T> T service(final Supplier<T> factory) {

        if ( factory == null ) {
            throw new NullPointerException("null factory");
        }

        return locator().get(factory);
    }

    /**
     * {@linkplain #get(Supplier, Supplier) Retrieves} a shared assert from the active locator.
     *
     * @param factory  the factory responsible for creating the required shared service; must return a non-null and
     *                 thread-safe object
     * @param delegate the factory responsible for creating a fallback delegate service if a circular service dependency
     *                 is detected
     * @param <T>      the type of the shared service created by {@code factory} and {@code delegate}
     *
     * @return the shared service created by {@code factory} or by its plugin replacement if one was
     *         {@linkplain #set(Supplier, Supplier) specified}
     *
     * @throws IllegalArgumentException if either {@code factory} or {@code delegate} is null
     * @throws IllegalStateException    if called outside an active locator
     */
    public static <T> T service(final Supplier<T> factory, final Supplier<? extends T> delegate) {

        if ( factory == null ) {
            throw new NullPointerException("null factory");
        }

        if ( delegate == null ) {
            throw new NullPointerException("null delegate");
        }

        return locator().get(factory, delegate);
    }


    /**
     * Retrieves the default executor.
     *
     * @return the default executor, which creates a new virtual thread for each task
     */
    public static Executor executor() {
        return EXECUTOR;
    }

    /**
     * Retrieves a thread-limited executor.
     *
     * @param threads the maximum number of concurrent threads; {@code 0} returns the default unlimited executor
     *
     * @return a thread-limited executor that allows at most {@code threads} concurrent executions
     *
     * @throws IllegalArgumentException if {@code threads} is negative
     */
    public static Executor executor(final int threads) {

        if ( threads < 0 ) {
            throw new IllegalArgumentException(format("negative thread count <%d>", threads));
        }

        return threads == 0 ? EXECUTOR : new LimitingExecutor(EXECUTOR, threads);
    }


    /**
     * Executes a task asynchronously using the default executor.
     *
     * <p>The task is executed in the context of the current locator.</p>
     *
     * @param task the task to be executed
     *
     * @return a completable future representing the pending completion of the task
     *
     * @throws NullPointerException if {@code task} is {@code null}
     */
    public static CompletableFuture<Void> async(final Runnable task) {

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        return async(EXECUTOR, task);
    }

    /**
     * Executes a value-producing task asynchronously using the default executor.
     *
     * <p>The task is executed in the context of the current locator.</p>
     *
     * @param task the task to be executed
     * @param <V>  the type of the value produced by the task
     *
     * @return a completable future representing the pending completion of the task
     *
     * @throws NullPointerException if {@code task} is {@code null}
     */
    public static <V> CompletableFuture<V> async(final Supplier<V> task) {

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        return async(EXECUTOR, task);
    }


    /**
     * Executes a task asynchronously using a custom executor.
     *
     * <p>The task is executed in the context of the current locator.</p>
     *
     * @param executor the executor to use for running the task
     * @param task     the task to be executed
     *
     * @return a completable future representing the pending completion of the task
     *
     * @throws NullPointerException if either {@code task} or {@code executor} is {@code null}
     */
    public static CompletableFuture<Void> async(final Executor executor, final Runnable task) {

        if ( executor == null ) {
            throw new NullPointerException("null executor");
        }

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        final Locator locator=locator();

        return CompletableFuture.runAsync(() -> locator.exec(task), executor);
    }

    /**
     * Executes a value-producing task asynchronously using a custom executor.
     *
     * <p>The task is executed in the context of the current locator.</p>
     *
     * @param <V>      the type of the value produced by the task
     * @param executor the executor to use for running the task
     * @param task     the task to be executed
     *
     * @return a completable future representing the pending completion of the task
     *
     * @throws NullPointerException if either {@code task} or {@code executor} is {@code null}
     */
    public static <V> CompletableFuture<V> async(final Executor executor, final Supplier<V> task) {

        if ( executor == null ) {
            throw new NullPointerException("null executor");
        }

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        final Locator locator=locator();

        return CompletableFuture.supplyAsync(() -> locator.exec(task), executor);
    }


    private static Locator locator() {

        final Locator locator=SCOPE.get();

        if ( locator == null ) {
            throw new IllegalStateException("not running inside a service locator");
        }

        return locator;
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Map<Supplier<?>, Supplier<?>> factories=new HashMap<>();
    private final Map<Supplier<?>, Object> services=new LinkedHashMap<>(); // preserve initialization order

    private final Object pending=new Object(); // placeholder for detecting circular dependencies


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Retrieves the shared service created by a factory.
     *
     * <p>The new service is cached so that further calls for the same factory are idempotent.</p>
     *
     * <p>During object construction, nested shared service dependencies may be retrieved from this locator through
     * the static {@linkplain  #service(Supplier) service locator} method of the locator class. The locator used by the
     * service locator method is managed through a {@link ThreadLocal} variable, so it won't be available to object
     * constructors executed on a different thread.</p>
     *
     * @param factory the factory responsible for creating the required shared service; must return a non-null and
     *                thread-safe object
     * @param <T>     the type of the shared service created by {@code factory}
     *
     * @return the shared service created by {@code factory} or by its plugin replacement if one was
     *         {@linkplain #set(Supplier, Supplier) specified}
     *
     * @throws IllegalArgumentException if {@code factory} is null
     * @throws IllegalStateException    if a circular service dependency is detected
     */
    public <T> T get(final Supplier<T> factory) {
        return get(factory, () -> { throw new IllegalStateException("circular service dependency ["+factory+"]"); });
    }

    /**
     * Retrieves the shared service created by a factory.
     *
     * <p>The new service is cached so that further calls for the same factory are idempotent.</p>
     *
     * <p>During object construction, nested shared service dependencies may be retrieved from this locator through
     * the static {@linkplain  #service(Supplier) service locator} method of the locator class. The locator used by the
     * service locator method is managed through a {@link ThreadLocal} variable, so it won't be available to object
     * constructors executed on a different thread.</p>
     *
     * @param factory  the factory responsible for creating the required shared service; must return a non-null and
     *                 thread-safe object
     * @param delegate the factory responsible for creating a fallback delegate service if a circular service dependency
     *                 is detected
     * @param <T>      the type of the shared service created by {@code factory} and {@code delegate}
     *
     * @return the shared service created by {@code factory} or by its plugin replacement if one was
     *         {@linkplain #set(Supplier, Supplier) specified}
     *
     * @throws IllegalArgumentException if either {@code factory} or {@code delegate} is null
     */
    public <T> T get(final Supplier<T> factory, final Supplier<? extends T> delegate) {

        if ( factory == null ) {
            throw new NullPointerException("null factory");
        }

        if ( delegate == null ) {
            throw new NullPointerException("null delegate");
        }

        synchronized ( services ) {

            final T cached=(T)services.get(factory);

            if ( pending.equals(cached) ) { return delegate.get(); } else {

                return cached != null ? cached : exec(() -> {
                    try {

                        services.put(factory, pending); // mark factory as being acquired

                        final T acquired=((Supplier<T>)factories.getOrDefault(factory, factory)).get();

                        services.put(factory, acquired); // cache actual resource

                        return acquired;

                    } catch ( final Throwable e ) {

                        services.remove(factory); // roll back acquisition marker

                        throw e;

                    }
                });
            }

        }
    }

    /**
     * Replaces an service factory with a plugin.
     *
     * <p>Subsequent calls to {@link #get(Supplier)} using {@code factory} as key will return the shared service
     * created by {@code plugin}.</p>
     *
     * @param <T>     the type of the shared service created by {@code factory}
     * @param factory the factory to be replaced
     * @param plugin  the replacing factory; must return a non-null and thread-safe object
     *
     * @return this locator
     *
     * @throws IllegalArgumentException if either {@code factory} or {@code plugin} is null
     * @throws IllegalStateException    if {@code factory} service was already retrieved
     */
    public <T> Locator set(final Supplier<T> factory, final Supplier<T> plugin) throws IllegalStateException {

        if ( factory == null ) {
            throw new NullPointerException("null factory");
        }

        if ( plugin == null ) {
            throw new NullPointerException("null plugin");
        }

        synchronized ( services ) {

            if ( services.containsKey(factory) ) {
                throw new IllegalStateException("factory already in use");
            }

            factories.put(factory, plugin);

            return this;

        }
    }


    /**
     * Clears this locator.
     *
     * <p>All {@linkplain #get(Supplier) cached} service are purged. {@linkplain AutoCloseable Auto-closeable}
     * service are closed in inverse creation order before purging.</p>
     */
    @Override
    public void close() {
        synchronized ( services ) {
            try {

                final Logger logger=get(Logger.logger()); // !!! make sure logger is not released before other services

                for (final Map.Entry<Supplier<?>, Object> entry : services.entrySet()) {

                    final Supplier<Object> factory=(Supplier<Object>)entry.getKey();
                    final Object service=entry.getValue();

                    try {

                        if ( service instanceof AutoCloseable ) {
                            ((AutoCloseable)service).close();
                        }

                    } catch ( final Exception t ) {

                        logger.error(this,
                                format("error during service deletion [%s/%s]", factory, service), t);

                    }
                }

            } finally {

                factories.clear();
                services.clear();

            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Executes a task using shared services managed by this locator.
     *
     * <p>During task execution, shared service may be retrieved from this locator through the static {@linkplain
     * #service(Supplier) service locator} method of the locator class. The locator used by the service locator method
     * is managed through a {@link ThreadLocal} variable, so it won't be available to methods executed on a different
     * thread.</p>
     *
     * @param task the task to be executed
     *
     * @return this locator
     *
     * @throws NullPointerException if {@code task} is {@code null}
     */
    public Locator exec(final Runnable task) {

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        return exec(() -> {

            task.run();

            return this;

        });
    }

    /**
     * Executes a task using shared services managed by this locator.
     *
     * <p>During task execution, shared service may be retrieved from this locator through the static {@linkplain
     * #service(Supplier) service locator} method of the locator class. The locator used by the service locator method
     * is managed through a {@link ThreadLocal} variable, so it won't be available to methods executed on a different
     * thread.</p>
     *
     * @param task the task to be executed
     *
     * @return the value generated by {@code task}
     *
     * @throws NullPointerException if {@code task} is {@code null}
     */
    public <V> V exec(final Supplier<V> task) {

        if ( task == null ) {
            throw new NullPointerException("null task");
        }

        final Locator current=SCOPE.get();

        try {

            SCOPE.set(this);

            return task.get();

        } finally {

            SCOPE.set(current);

        }

    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class LimitingExecutor implements Executor {

        private final Executor delegate;
        private final Semaphore semaphore;


        private LimitingExecutor(final Executor delegate, final int threads) {
            this.delegate=delegate;
            this.semaphore=new Semaphore(threads);
        }


        @Override
        public void execute(final Runnable task) {
            delegate.execute(() -> {

                try {

                    semaphore.acquire();

                    task.run();

                } catch ( final InterruptedException ignored ) {

                    Thread.currentThread().interrupt();

                } finally {

                    semaphore.release();

                }

            });
        }

    }

}
