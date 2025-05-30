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

package eu.ec2u.work.ai;

import java.util.concurrent.ThreadLocalRandom;

import static java.lang.Math.*;
import static java.lang.StrictMath.pow;
import static java.lang.String.format;
import static java.lang.System.currentTimeMillis;

/**
 * Adaptive throttle for rate-limiting concurrent task execution.
 * <p>
 * Implements exponential backoff and recovery mechanisms to dynamically adjust execution rates based on load and
 * success rates. The throttle maintains a queue counter tracking active tasks and adapts delays accordingly.
 */
@SuppressWarnings("SynchronizedMethod")
public final class Throttle {

    private static final int DEFAULT_MINIMUM=100;
    private static final int DEFAULT_MAXIMUM=60*1000;

    private static final double DEFAULT_BACKOFF=1.10;
    private static final double DEFAULT_RECOVER=0.95;


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final long minimum;
    private final long maximum;

    private final double backoff;
    private final double recover;


    private long delay; // the current baseline delay between two task executions ([ms])
    private long fence; // the timestamp of the last task execution ([ms] since epoch)
    private long queue; // the number of active task


    /**
     * Creates a throttle with default parameters.
     * <p>
     * Uses minimum delay of {@value DEFAULT_MINIMUM} ms, maximum delay of {@value DEFAULT_MAXIMUM} ms, backoff factor
     * of {@value DEFAULT_BACKOFF}, and recovery factor of {@value DEFAULT_RECOVER}.
     */
    public Throttle() {
        this(
                DEFAULT_MINIMUM,
                DEFAULT_MAXIMUM,
                DEFAULT_BACKOFF,
                DEFAULT_RECOVER);
    }

    /**
     * Creates a throttle with custom parameters.
     *
     * @param minimum the minimum delay between task executions in milliseconds
     * @param maximum the maximum delay between task executions in milliseconds
     * @param backoff the multiplicative factor for increasing delays on failure (must be >= 1.0)
     * @param recover the multiplicative factor for decreasing delays on success (must be between 0.0 and 1.0)
     *
     * @throws IllegalArgumentException if minimum or maximum is negative, backoff is less than 1.0, or recover is not
     *                                  between 0.0 and 1.0
     */
    public Throttle(
            final long minimum,
            final long maximum,
            final double backoff,
            final double recover
    ) {

        if ( minimum < 0 ) {
            throw new IllegalArgumentException(format("negative minimum <%d>", minimum));
        }

        if ( maximum < 0 ) {
            throw new IllegalArgumentException(format("negative maximum <%d>", maximum));
        }

        if ( minimum > maximum ) {
            throw new IllegalArgumentException(format("conflicting minimum <%d> and maximum <%d>", minimum, maximum));
        }

        if ( backoff < 1.0 ) {
            throw new IllegalArgumentException(format("illegal backoff <%.3f>", backoff));
        }

        if ( recover < 0 || recover > 1.0 ) {
            throw new IllegalArgumentException(format("illegal recover <%.3f>", recover));
        }

        this.minimum=minimum;
        this.maximum=maximum;
        this.backoff=backoff;
        this.recover=recover;
    }


    /**
     * Configures the minimum delay between task executions.
     *
     * @param minimum the minimum delay in milliseconds
     *
     * @return a new throttle instance with the updated minimum delay
     *
     * @throws IllegalArgumentException if minimum is negative
     */
    public Throttle minimum(final long minimum) {
        return new Throttle(
                minimum,
                maximum,
                backoff,
                recover
        );
    }

    /**
     * Configures the maximum delay between task executions.
     *
     * @param maximum the maximum delay in milliseconds
     *
     * @return a new throttle instance with the updated maximum delay
     *
     * @throws IllegalArgumentException if maximum is negative
     */
    public Throttle maximum(final long maximum) {
        return new Throttle(
                minimum,
                maximum,
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
    public Throttle backoff(final double backoff) {
        return new Throttle(
                minimum,
                maximum,
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
    public Throttle recover(final double recover) {
        return new Throttle(
                minimum,
                maximum,
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
    public long await() {

        while ( delay() ) {
            try {

                Thread.sleep(minimum+ThreadLocalRandom.current().nextLong(minimum));

            } catch ( final InterruptedException e ) {

                Thread.currentThread().interrupt();

                return 0;

            }
        }

        return execute();
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
     * @param retry the explicit retry delay in milliseconds, or 0 for successful completion
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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Checks if the current thread should wait before executing a task.
     * <p>
     * Uses exponential backoff based on queue size: more concurrent tasks result in longer delays.
     *
     * @return {@code true} if the caller should wait before proceeding
     */
    private synchronized boolean delay() {
        return fence+clamp(delay*pow(backoff, queue), minimum, maximum) > currentTimeMillis();
    }

    /**
     * Records the execution of a new task.
     * <p>
     * Updates the fence timestamp to the current time and increments the queue counter to track the number of active
     * concurrent tasks.
     *
     * @return the time elapsed since the last task execution in milliseconds
     */
    private synchronized long execute() {

        final long last=fence;
        final long next=currentTimeMillis();

        fence=next;
        queue++;

        return next-last;
    }

    /**
     * Adapts the throttling parameters based on task completion status.
     * <p>
     * Decrements the queue counter and adjusts the baseline delay: - On successful completion: reduces delay by the
     * recover factor (speeds up) - On failure/retry: increases delay by the backoff factor (slows down)
     * <p>
     * The delay is always clamped between minimum and maximum bounds, with retry delays taking precedence when
     * specified.
     *
     * @param completed {@code true} if the task completed successfully, {@code false} if it failed
     * @param retry     the explicit retry delay in milliseconds, or 0 for adaptive behavior
     *
     * @return the new baseline delay in milliseconds
     */
    private synchronized long adapt(final boolean completed, final long retry) {

        queue--;

        return delay=max(retry, completed
                ? max(round(delay*recover), minimum)
                : min(round(delay*backoff), maximum)
        );
    }

}
