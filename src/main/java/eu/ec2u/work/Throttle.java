/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.work;

import java.util.concurrent.ThreadLocalRandom;
import java.util.function.UnaryOperator;

import static java.lang.Math.*;
import static java.lang.StrictMath.pow;
import static java.lang.String.format;
import static java.lang.System.currentTimeMillis;

/**
 * Adaptive throttle for rate-limiting concurrent task execution.
 *
 * <p>Implements exponential backoff and recovery mechanisms to dynamically adjust execution rates based on load and
 * success rates.</p>
 */
@SuppressWarnings("SynchronizedMethod")
public final class Throttle<T> implements UnaryOperator<T> {

    private final long minimum;
    private final long maximum;

    private final double buildup;
    private final double backoff;
    private final double recover;

    private boolean dirty; // true if the last response was a rejection, restricting pending tasks to 1

    private long delay; // the current baseline delay between two task executions ([ms])
    private long fence; // the timestamp of the last task execution ([ms] since epoch)
    private long queue; // the number of active task


    /**
     * Creates a throttle with default parameters for unrestricted execution.
     */
    public Throttle() {
        this(
                0,
                0,
                1,
                1,
                1
        );
    }

    /**
     * Creates a throttle with custom parameters.
     *
     * @param minimum the minimum delay between task executions in milliseconds
     * @param maximum the maximum delay between task executions in milliseconds; 0 means no limit
     * @param buildup the exponential factor for queue-based delay increases (must be >= 1.0)
     * @param backoff the multiplicative factor for increasing delays on failure (must be >= 1.0)
     * @param recover the multiplicative factor for decreasing delays on success (must be between 0.0 and 1.0)
     *
     * @throws IllegalArgumentException if minimum or maximum is negative, buildup or backoff is less than 1.0, or
     *                                  recover is not between 0.0 and 1.0
     */
    public Throttle(
            final long minimum,
            final long maximum,
            final double buildup,
            final double backoff,
            final double recover
    ) {

        if ( minimum < 0 ) {
            throw new IllegalArgumentException(format(
                    "negative minimum delay <%d>", minimum
            ));
        }

        if ( maximum < 0 ) {
            throw new IllegalArgumentException(format(
                    "negative maximum delay <%d>", maximum
            ));
        }

        if ( maximum > 0 && minimum > maximum ) {
            throw new IllegalArgumentException(format(
                    "conflicting minimum <%d> and maximum <%d> delays", minimum, maximum
            ));
        }

        if ( buildup < 1.0 ) {
            throw new IllegalArgumentException(format(
                    "illegal buildup factor <%.3f>", buildup
            ));
        }

        if ( backoff < 1.0 ) {
            throw new IllegalArgumentException(format(
                    "illegal backoff factor <%.3f>", backoff
            ));
        }

        if ( recover < 0 || recover > 1.0 ) {
            throw new IllegalArgumentException(format(
                    "illegal recover factor <%.3f>", recover
            ));
        }

        this.minimum=minimum;
        this.maximum=maximum == 0 ? Long.MAX_VALUE : maximum;

        this.buildup=buildup;
        this.backoff=backoff;
        this.recover=recover;

        this.delay=minimum;
        this.fence=currentTimeMillis();
    }


    /**
     * Configures the minimum delay between task executions.
     *
     * @param minimum the minimum delay in milliseconds
     *
     * @return a new throttle instance with the updated minimum delay
     *
     * @throws IllegalArgumentException if minimum is negative or greater than maximum
     */
    public Throttle<T> minimum(final long minimum) {
        return new Throttle<>(
                minimum,
                maximum,
                buildup,
                backoff,
                recover
        );
    }

    /**
     * Configures the maximum delay between task executions.
     *
     * @param maximum the maximum delay in milliseconds; 0 means no limit
     *
     * @return a new throttle instance with the updated maximum delay
     *
     * @throws IllegalArgumentException if maximum is negative or less than minimum
     */
    public Throttle<T> maximum(final long maximum) {
        return new Throttle<>(
                minimum,
                maximum,
                buildup,
                backoff,
                recover
        );
    }


    /**
     * Configures the buildup factor for exponential queue-based delays.
     *
     * @param buildup the exponential factor for delay increases based on queue size (must be >= 1.0)
     *
     * @return a new throttle instance with the updated buildup factor
     *
     * @throws IllegalArgumentException if buildup is less than 1.0
     */
    public Throttle<T> buildup(final double buildup) {
        return new Throttle<>(
                minimum,
                maximum,
                buildup,
                backoff,
                recover
        );
    }

    /**
     * Configures the backoff factor for increasing delays on task failure.
     *
     * @param backoff the multiplicative factor for delay increases (must be >= 1.0)
     *
     * @return a new throttle instance with the updated backoff factor
     *
     * @throws IllegalArgumentException if backoff is less than 1.0
     */
    public Throttle<T> backoff(final double backoff) {
        return new Throttle<>(
                minimum,
                maximum,
                buildup,
                backoff,
                recover
        );
    }

    /**
     * Configures the recovery factor for decreasing delays on task success.
     *
     * @param recover the multiplicative factor for delay decreases (must be between 0.0 and 1.0)
     *
     * @return a new throttle instance with the updated recovery factor
     *
     * @throws IllegalArgumentException if recover is not between 0.0 and 1.0
     */
    public Throttle<T> recover(final double recover) {
        return new Throttle<>(
                minimum,
                maximum,
                buildup,
                backoff,
                recover
        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Waits for permission to execute a task, respecting throttling constraints.
     * <p>
     * Blocks the current thread until the throttle determines it's safe to proceed based on current load and timing.
     * Uses randomized sleep intervals to avoid thundering herd effects.
     *
     * @return the time elapsed since the last task execution in milliseconds, or 0 if interrupted
     */
    public long await() { return await(true); }

    /**
     * Waits for permission to execute a task, respecting throttling constraints.
     * <p>
     * Blocks the current thread until the throttle determines it's safe to proceed based on current load and timing.
     * Uses randomized sleep intervals to avoid thundering herd effects.
     *
     * @param adapt {@code true} to increment the queue counter and expect completion feedback through the
     *              {@link #adapt(boolean)} or {@link #adapt(long)} methods, {@code false} otherwise
     *
     * @return the time elapsed since the last task execution in milliseconds, or 0 if interrupted
     */
    public long await(final boolean adapt) {

        long elapsed;

        while ( (elapsed=delay(adapt)) < 0 ) {
            try {

                Thread.sleep(minimum+ThreadLocalRandom.current().nextLong(minimum));

            } catch ( final InterruptedException e ) {

                Thread.currentThread().interrupt();

                return 0;

            }
        }

        return elapsed;
    }


    /**
     * Adapts throttling parameters based on task completion status.
     *
     * @param completed {@code true} if the task completed successfully, {@code false} if it failed
     *
     * @return the new baseline delay in milliseconds
     */
    public long adapt(final boolean completed) {
        return adapt(completed, 0);
    }

    /**
     * Adapts throttling parameters with an explicit retry delay.
     *
     * @param retry the explicit retry delay in milliseconds; 0 indicates successful task completion
     *
     * @return the new baseline delay in milliseconds
     *
     * @throws IllegalArgumentException if retry is negative
     */
    public long adapt(final long retry) {

        if ( retry < 0 ) {
            throw new IllegalArgumentException(format("negative delay <%d>", retry));
        }

        return adapt(retry == 0, retry);
    }


    /**
     * Applies throttling to a value by waiting without affecting the queue counter.
     * <p>
     * This method implements the {@link UnaryOperator} interface, allowing the throttle to be used in functional
     * programming contexts where rate limiting is needed.
     *
     * @param value the input value to pass through
     *
     * @return the same value after applying throttling delay
     */
    @Override
    public T apply(final T value) {

        await(false);

        return value;
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Attempts to reserve an execution slot, respecting throttling constraints.
     * <p>
     * Uses exponential backoff based on queue size: more concurrent tasks result in longer delays. After a failure,
     * only allows one request at a time until a success occurs. If successful, atomically updates the fence timestamp
     * and optionally increments the queue counter.
     *
     * @param adapt {@code true} to increment the queue counter, {@code false} to leave it unchanged
     *
     * @return the time elapsed since the last task execution in milliseconds, or a negative value if the caller should
     *         wait
     */
    private synchronized long delay(final boolean adapt) {

        final long next=currentTimeMillis();
        final long wait=clamp(round(delay*pow(buildup, queue)), minimum, maximum);

        if ( dirty && queue > 0 || fence+wait > next ) { return -1; } else {

            final long last=fence;

            fence=next;

            if ( adapt ) { queue++; }

            return next-last;

        }

    }

    /**
     * Adapts the throttling parameters based on task completion status.
     * <p>
     * Decrements the queue counter and adjusts the baseline delay:
     * <ul>
     * <li>On successful completion: reduces delay by the recover factor (speeds up) and clears failure state</li>
     * <li>On failure/retry: increases delay by the backoff factor (slows down) and sets failure state</li>
     * </ul>
     * <p>
     * The delay is always clamped between minimum and maximum bounds, with retry delays taking precedence when
     * specified. After a failure, the throttle restricts new tasks until the current one succeeds.
     *
     * @param completed {@code true} if the task completed successfully, {@code false} if it failed
     * @param retry     the explicit retry delay in milliseconds, or 0 for adaptive behavior
     *
     * @return the new baseline delay in milliseconds
     */
    private synchronized long adapt(final boolean completed, final long retry) {

        dirty=!completed;
        queue--;

        return delay=max(retry, completed
                ? max(round(delay*recover), minimum)
                : min(round(delay*backoff), maximum)
        );
    }

}
