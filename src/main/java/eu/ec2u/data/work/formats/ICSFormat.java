/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.work.formats;

import com.metreeca.rest.*;
import com.metreeca.rest.formats.InputFormat;
import com.metreeca.rest.formats.OutputFormat;

import net.fortuna.ical4j.data.*;
import net.fortuna.ical4j.model.Calendar;

import java.io.*;
import java.util.regex.Pattern;

import static com.metreeca.rest.MessageException.status;
import static com.metreeca.rest.Response.BadRequest;
import static com.metreeca.rest.Response.UnsupportedMediaType;
import static com.metreeca.rest.formats.InputFormat.input;
import static com.metreeca.rest.formats.OutputFormat.output;


/**
 * iCalendar message format.
 *
 * @see <a href="https://www.rfc-editor.org/rfc/rfc5545.html">RFC 5545 - Internet Calendaring and Scheduling Core Object
 * Specification (iCalendar)</a>
 */
public final class ICSFormat extends Format<Calendar> {

    /**
     * The default MIME type for iCalendar message bodies ({@value}).
     */
    public static final String MIME="text/calendar";

    /**
     * A pattern matching iCalendar-based MIME types.
     */
    public static final Pattern MIMEPattern=Pattern.compile(
            "(?i:^(text/calendar)(?:\\s*;.*)?$)"
    );


    /**
     * Creates an iCalendar message format.
     *
     * @return a new iCalendar message format
     */
    public static ICSFormat ics() {
        return new ICSFormat();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @return the default MIME type for XML messages ({@value MIME})
     */
    @Override public String mime() {
        return MIME;
    }

    /**
     * Decodes the iCalendar {@code message} body from the input stream supplied by the {@code message} {@link
     * InputFormat} body, if one is available and the {@code message} {@code Content-Type} header is either missing or
     * matched by {@link #MIMEPattern}
     */
    @Override public Either<MessageException, Calendar> decode(final Message<?> message) {
        return message

                .header("Content-Type")

                .filter(MIMEPattern.asPredicate().or(String::isEmpty))

                .map(type -> message.body(input()).flatMap(source -> {

                    try (
                            final InputStream input=source.get();
                            final Reader reader=new InputStreamReader(input, message.charset())
                    ) {

                        return Either.Right(new CalendarBuilder().build(input));

                    } catch ( final UnsupportedEncodingException|ParserException e ) {

                        return Either.Left(status(BadRequest, e));

                    } catch ( final IOException e ) {

                        throw new UncheckedIOException(e);

                    }

                }))

                .orElseGet(() -> Either.Left(status(UnsupportedMediaType, "no iCalendar body")));
    }

    /**
     * Configures {@code message} {@code Content-Type} header to {@value #MIME}, unless already defined, and encodes the
     * iCalendar {@code value} into the output stream accepted by the {@code message} {@link OutputFormat} body
     */
    @Override public <M extends Message<M>> M encode(final M message, final Calendar value) {
        return message

                .header("~Content-Type", MIME)

                .body(output(), output -> {
                    try ( final Writer writer=new OutputStreamWriter(output, message.charset()) ) {

                        new CalendarOutputter().output(value, writer);

                    } catch ( final IOException e ) {

                        throw new UncheckedIOException(e);

                    }
                });
    }

}
