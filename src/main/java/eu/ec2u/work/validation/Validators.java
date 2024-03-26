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

package eu.ec2u.work.validation;

import com.metreeca.http.rdf.Frame;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Stream;

public final class Validators {

    public static Xtream<Collection<Statement>> validate(
            final Shape shape, final Set<IRI> types, final Stream<Frame> frames
    ) {
        return validate(shape, types, frames, Stream.empty());
    }

    public static Xtream<Collection<Statement>> validate(
            final Shape shape, final Set<IRI> types, final Stream<Frame> frames, final Stream<Frame> context
    ) {

        throw new UnsupportedOperationException(";( be implemented"); // !!!

        // final Reasoner reasoner=service(Reasoner::new);
        //
        //
        // final List<Frame> batch=frames.collect(toList());
        //
        // final Set<Value> resources=batch.stream().map(Frame::focus).collect(toSet());
        //
        // final Collection<Statement> explicit=batch.stream().flatMap(Frame::stream).collect(toSet());
        // final Collection<Statement> extended=reasoner.apply(Stream
        //
        //         .concat(
        //                 explicit.stream(),
        //                 context.flatMap(Frame::stream)
        //         )
        //
        //         .collect(toSet())
        // );
        //
        // final long mistyped=resources.stream()
        //
        //         .filter(resource -> {
        //
        //             final boolean invalid=!resource.isResource() || extended.stream()
        //                     .filter(pattern(resource, RDF.TYPE, null))
        //                     .map(Statement::getObject)
        //                     .noneMatch(types::contains);
        //
        //             if ( invalid ) {
        //
        //                 service(logger()).warning(Validators.class, format(
        //                         "mistyped frame <%s> %s", resource, extended.stream()
        //                                 .filter(pattern(resource, RDF.TYPE, null))
        //                                 .map(Statement::getObject)
        //                                 .collect(toSet())
        //                 ));
        //
        //             }
        //
        //             return invalid;
        //
        //         })
        //
        //         .count();
        //
        // if ( mistyped > 0 ) {
        //     throw new IllegalArgumentException(format("<%d> mistyped frames in batch", mistyped));
        // }
        //
        // final long invalid=types.stream()
        //         .flatMap(type -> frame(type, extended).frames(inverse(RDF.TYPE)))
        //         .map(new Validate())
        //         .filter(Optional::isEmpty)
        //         .count();
        //
        // if ( invalid != 0 ) {
        //     throw new IllegalArgumentException(format("<%d> malformed frames in batch", invalid));
        // }
        //
        // return Xtream.of(explicit);
    }

}
