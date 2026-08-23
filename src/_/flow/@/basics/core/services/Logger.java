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

package com.metreeca.flow.services;


import com.metreeca.shim.Loggers;

import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.LogRecord;

import static java.util.logging.Level.*;


/**
 * Event logger.
 *
 * <p>Provides access to system-specific logging facilities.</p>
 */
public abstract class Logger {

    /**
     * Retrieves the default logger factory.
     *
     * @return the default logger factory, which logs events through the the standard
     *         {@linkplain LogManager Java logging} facilities
     */
    public static Supplier<Logger> logger() {
        return () -> {

            try {

                return new SystemLogger();

            } finally {
                Loggers.logging(INFO);
            }

        };
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Adds an error log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message for the log entry
     *
     * @return this logger
     */
    public final Logger error(final Object source, final String message) {
        return error(source, () -> message);
    }

    /**
     * Adds an error log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message supplier for the log entry
     *
     * @return this logger
     */
    public final Logger error(final Object source, final Supplier<String> message) {
        return entry(SEVERE, source, message, null);
    }

    /**
     * Adds an exceptional error log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message for the log entry
     * @param cause   the throwable that caused the traced exceptional condition
     *
     * @return this logger
     */
    public final Logger error(final Object source, final String message, final Throwable cause) {
        return error(source, () -> message, cause);
    }

    /**
     * Adds an exceptional error log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message supplier for the log entry
     * @param cause   the throwable that caused the traced exceptional condition
     *
     * @return this logger
     */
    public final Logger error(final Object source, final Supplier<String> message, final Throwable cause) {
        return entry(SEVERE, source, message, cause);
    }


    /**
     * Adds a warning log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message for the log entry
     *
     * @return this logger
     */
    public final Logger warning(final Object source, final String message) {
        return warning(source, () -> message);
    }

    /**
     * Adds a warning log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message supplier for the log entry
     *
     * @return this logger
     */
    public final Logger warning(final Object source, final Supplier<String> message) {
        return entry(WARNING, source, message, null);
    }

    /**
     * Adds an exceptional warning log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message for the log entry
     * @param cause   the throwable that caused the traced exceptional condition
     *
     * @return this logger
     */
    public final Logger warning(final Object source, final String message, final Throwable cause) {
        return warning(source, () -> message, cause);
    }

    /**
     * Adds an exceptional warning log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message supplier for the log entry
     * @param cause   the throwable that caused the traced exceptional condition
     *
     * @return this logger
     */
    public final Logger warning(final Object source, final Supplier<String> message, final Throwable cause) {
        return entry(WARNING, source, message, cause);
    }


    /**
     * Adds an info log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message for the log entry
     *
     * @return this logger
     */
    public final Logger info(final Object source, final String message) {
        return info(source, () -> message);
    }

    /**
     * Adds an info log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message supplier for the log entry
     *
     * @return this logger
     */
    public final Logger info(final Object source, final Supplier<String> message) {
        return entry(INFO, source, message, null);
    }


    /**
     * Adds a debug log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message for the log entry
     *
     * @return this logger
     */
    public final Logger debug(final Object source, final String message) {
        return debug(source, () -> message);
    }

    /**
     * Adds a debug log entry.
     *
     * @param source  the source object for the log entry or {@code null} for global log entries
     * @param message the message supplier for the log entry
     *
     * @return this logger
     */
    public final Logger debug(final Object source, final Supplier<String> message) {
        return entry(FINE, source, message, null);
    }


    /**
     * Adds a log entry.
     *
     * @param level   the logging level for the log entry
     * @param source  the source object for the log entry or {@code null} for global log entries; may be a
     *                human-readable string label
     * @param message the message supplier for the log entry
     * @param cause   the throwable that caused the traced exceptional condition or {@code null} if immaterial
     *
     * @return this logger
     */
    public abstract Logger entry(
            final java.util.logging.Level level,
            final Object source,
            final Supplier<String> message,
            final Throwable cause
    );


    private static final class SystemLogger extends Logger {

        @Override public Logger entry(final Level level,
                final Object source, final Supplier<String> message, final Throwable cause
        ) {

            final String logger=(source == null) ? ""
                    : source instanceof String ? source.toString()
                    : source instanceof Class ? ((Class<?>)source).getName()
                    : source.getClass().getName();

            final String text=message.get();

            final LogRecord record=new LogRecord(level,
                    text.indexOf('\n') >= 0 && !text.endsWith("\n") ? text+"\n" : text
            );

            record.setLoggerName(logger);
            record.setSourceClassName(logger);
            record.setThrown(cause);

            java.util.logging.Logger.getLogger(logger).log(record);

            return this;
        }
    }

}
