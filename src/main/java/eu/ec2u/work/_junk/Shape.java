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

package eu.ec2u.work._junk;

import com.metreeca.flow.rdf.Values;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;

import java.util.Collection;
import java.util.Set;
import java.util.function.Supplier;

public final class Shape {
    public static final IRI LITERAL=Values.iri();
    public static final String ANY_LOCALE="*";
    public static final String NOT_LOCALE="";

    public static Collection<Statement> encode(Shape[] shapes) {
        return null;
    }

    public static Shape shape(Shape... shapes) {
        return null;
    }

    public static Shape shape(IRI target, Shape... shapes) {
        return null;
    }

    public static Shape bool() {
        return null;
    }

    public static Shape composite(Shape... shapes) {
        return null;
    }

    public static Shape string() {
        return null;
    }

    public static Shape in(Value... values) {
        return null;
    }

    public static Shape property(IRI url, Shape shape) {
        return null;
    }

    public static Shape property(final String name, IRI url, Shape shape) {
        return null;
    }

    public static Shape property(final String name, IRI url, Supplier<Shape> shape) {
        return null;
    }

    public static Shape property(IRI url, Supplier<Shape> shape) {
        return null;
    }

    public static Shape optional(final Shape... shapes) {
        return null;
    }

    public static Shape repeatable(final Shape... shapes) {
        return null;
    }

    public static Shape multiple(final Shape... shapes) {
        return null;
    }

    public static Shape required(final Shape... shapes) {
        return null;
    }

    public static Shape text(Set<String> locales) {
        return null;
    }

    public static Shape id() {
        return null;
    }

    public static Shape dateTime() {
        return null;
    }

    public static Shape duration() {
        return null;
    }

    public static Shape maxLength(int limit) {
        return null;
    }

    public static Shape decimal() {
        return null;
    }

    public static Shape year() {
        return null;
    }

    public static Shape integer() {
        return null;
    }

    public static Shape hasValue(Value... values) {
        return null;
    }

    public static Shape date() {
        return null;
    }

    public static Shape datatype(IRI iri) {
        return null;
    }

    public static Shape pattern(String s) {
        return null;
    }

    public static Shape minInclusive(int i) {
        return null;
    }

    public static Shape scheme(IRI organizationTypes) {
        return null;
    }
}
