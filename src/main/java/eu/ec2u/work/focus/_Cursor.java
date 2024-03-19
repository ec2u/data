/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.work.focus;

import com.metreeca.http.rdf.Shift;
import com.metreeca.http.rdf.Shift.Path;
import com.metreeca.http.rdf.Shift.Seq;
import com.metreeca.http.rdf.Shift.Step;
import com.metreeca.http.rdf.Values;
import com.metreeca.link.Frame;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.http.rdf.Shift.Seq.seq;
import static com.metreeca.http.rdf.Values.lang;
import static com.metreeca.link.Frame.reverse;

import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

public final class _Cursor implements AutoCloseable {

    private final Value focus;
    private final RepositoryConnection connection;

    private Map<Value, Collection<Statement>> forward;
    private Map<Value, Collection<Statement>> backward;


    public _Cursor(final Value focus, final RepositoryConnection connection) {

        if ( focus == null ) {
            throw new NullPointerException("null focus");
        }

        if ( connection == null ) {
            throw new NullPointerException("null connection");
        }

        this.focus=focus;
        this.connection=connection;
    }

    private _Cursor(final Value focus, final RepositoryConnection connection,
            final Map<Value, Collection<Statement>> forward, final Map<Value, Collection<Statement>> backward
    ) {

        this.focus=focus;
        this.connection=connection;
        this.forward=forward;
        this.backward=backward;
    }


    @Override public void close() throws Exception {
        connection.close();
    }


    public Value focus() {
        return focus;
    }


    public Stream<IRI> iris(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return values(iri)
                .map(Values::iri)
                .filter(Optional::isPresent)
                .map(Optional::get);
    }


    public Optional<String> string(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return strings(iri).findFirst();
    }

    public Stream<String> strings(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return values(iri)
                .map(Values::string)
                .filter(Optional::isPresent)
                .map(Optional::get);
    }

    public Stream<String> strings(final Path path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return values(path)
                .map(Values::string)
                .filter(Optional::isPresent)
                .map(Optional::get);
    }


    public Optional<String> localized(final IRI iri, final String lang) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        if ( lang == null ) {
            throw new NullPointerException("null lang");
        }

        return localizeds(iri, lang)
                .findFirst();
    }

    public Optional<String> localized(final Path path, final String lang) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        if ( lang == null ) {
            throw new NullPointerException("null lang");
        }

        return localizeds(path, lang)
                .findFirst();
    }

    public Stream<String> localizeds(final IRI iri, final String lang) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        if ( lang == null ) {
            throw new NullPointerException("null lang");
        }

        return values(iri)
                .filter(v -> lang(v).equals(lang))
                .map(v -> v.stringValue());
    }

    public Stream<String> localizeds(final Path path, final String lang) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        if ( lang == null ) {
            throw new NullPointerException("null lang");
        }

        return values(path)
                .filter(v -> lang(v).equals(lang))
                .map(v -> v.stringValue());
    }


    public Optional<_Cursor> cursor(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return cursors(iri).findFirst();
    }

    public Optional<_Cursor> cursor(final Path path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return cursors(path).findFirst();
    }


    public Stream<_Cursor> cursors(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return values(iri).map(value -> new _Cursor(value, connection, forward, backward));
    }

    public Stream<_Cursor> cursors(final Path path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return values(path).map(value -> new _Cursor(value, connection, forward, backward));
    }


    public Optional<Value> value(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return values(iri).findFirst();
    }

    public Optional<Value> value(final Path path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return values(path).findFirst();
    }


    public Stream<Value> values(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return Frame.forward(iri)
                ? focus.isResource() ? forward(iri) : Stream.empty()
                : backward(iri);
    }

    public Stream<Value> values(final Path path) {

        if ( path == null ) {
            throw new NullPointerException("null path");
        }

        return path.map(new Shift.Probe<>() {

            @Override public Stream<Value> probe(final Step step) {
                return values(step.iri());
            }

            @Override public Stream<Value> probe(final Seq seq) {

                final List<Path> paths=seq.paths();

                return paths.isEmpty() ? Stream.of(focus)
                        : paths.size() == 1 ? values(paths.get(0))
                        : cursors(paths.get(0)).flatMap(cursor ->
                        cursor.values(seq(paths.subList(1, paths.size()))));
            }

            //@Override public Stream<Value> probe(final Alt alt) {
            //    return super.probe(alt);
            //}

            @Override public Stream<Value> probe(final Shift shift) {
                throw new UnsupportedOperationException(format(
                        "unsupported shift type <%s>", shift.getClass().getSimpleName()
                ));
            }

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> forward(final IRI iri) {

        final Collection<Statement> statements=(forward != null ? forward : (forward=new HashMap<>()))
                .computeIfAbsent(focus, value -> connection
                        .getStatements((Resource)value, null, null)
                        .stream()
                        .collect(toList())
                );

        return statements
                .stream()
                .filter(s -> s.getPredicate().equals(iri))
                .map(Statement::getObject)
                .distinct();
    }

    private Stream<Value> backward(final IRI iri) {

        final Collection<Statement> statements=(backward != null ? backward : (backward=new HashMap<>()))
                .computeIfAbsent(focus, value -> connection
                        .getStatements(null, null, value)
                        .stream()
                        .collect(toList())
                );

        final IRI reverse=reverse(iri);

        return statements
                .stream()
                .filter(s -> s.getPredicate().equals(reverse))
                .map(Statement::getSubject)
                .map(Value.class::cast)
                .distinct();
    }

}
