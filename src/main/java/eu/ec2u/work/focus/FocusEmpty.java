/*
 * Copyright © 2023 Metreeca srl
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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;

import java.util.Arrays;
import java.util.Objects;
import java.util.stream.Stream;

final class FocusEmpty implements Focus {

    static final FocusEmpty Instance=new FocusEmpty();


    @Override public Stream<Focus> split() {
        return Stream.of(this);
    }


    @Override public Stream<Value> values() {
        return Stream.empty();
    }


    @Override public Focus seq(final IRI step) {

        if ( step == null ) {
            throw new NullPointerException("null step");
        }

        return this;
    }

    @Override public Focus seq(final IRI... steps) {

        if ( steps == null || Arrays.stream(steps).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null steps");
        }

        return this;
    }


    @Override public Focus inv(final IRI step) {

        if ( step == null ) {
            throw new NullPointerException("null step");
        }

        return this;
    }

}
