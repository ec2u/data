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

package com.metreeca.flow.xml.actions;

import com.metreeca.flow.http.FormatException;

import org.w3c.dom.*;

import java.io.ByteArrayInputStream;
import java.util.Locale;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.flow.xml.XPath.normalize;
import static com.metreeca.flow.xml.formats.HTML.html;

import static java.nio.charset.StandardCharsets.UTF_8;

/**
 * X/HTML to Markdown conversion.
 *
 * <p>Converts an X/HTMl document to a markdown-based plain text representation.</p>
 */
public final class Untag implements Function<Node, String> {

    /**
     * Converts an X/HTMl document to a markdown-based plain text representation.
     *
     * @param document the content of the X/HTML document
     *
     * @return the markdown-based plain text representation of {@code document} or the original {@code document}
     * contents if unable to parse it as an X/HTML document
     *
     * @throws NullPointerException id {@code document } is {@code null}
     */
    public static String untag(final String document) {

        if ( document == null ) {
            throw new NullPointerException("null document");
        }

        try {

            return new Untag().apply(html(new ByteArrayInputStream(document.getBytes(UTF_8)), UTF_8, ""));

        } catch ( final FormatException e ) {

            return document;

        }
    }


    @Override public String apply(final Node element) {
        return element == null ? "" : new Builder().format(element).toString();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class Builder {

        private int indent;
        private boolean space;

        private final StringBuilder builder=new StringBuilder(100);


        private Builder format(final NodeList nodes) {

            for (int i=0, n=nodes.getLength(); i < n; ++i) {
                format(nodes.item(i));
            }

            return this;
        }

        private Builder format(final Node node) {
            return node instanceof Document ? format((Document)node)
                    : node instanceof Element ? format((Element)node)
                    : node instanceof Text ? format((Text)node)
                    : this;
        }

        private Builder format(final Document document) {

            document.normalize();

            format(document.getDocumentElement());

            return this;
        }

        private Builder format(final Element element) {
            switch ( element.getTagName().toLowerCase(Locale.ROOT) ) {

                case "h1":

                    return append("# ").append(normalize(element.getTextContent())).feed();

                case "h2":

                    return append("## ").append(normalize(element.getTextContent())).feed();

                case "h3":

                    return append("### ").append(normalize(element.getTextContent())).feed();

                case "p":
                case "div":
                case "section":

                    return format(element.getChildNodes()).feed();

                case "ul":
                case "ol":

                    return indent().format(element.getChildNodes()).outdent().feed();

                case "li":

                    return append("- ").format(element.getChildNodes()).wrap();

                case "br":

                    return append("  ").wrap();

                case "hr":

                    return append("---").feed();

                case "a":

                    return append("[").format(element.getChildNodes()).append("]").append("(")
                            .append(element.getAttribute("href")).append(")");

                case "img":

                    return append("![").format(element.getAttributeNode("alt")).append("]").append("(")
                            .append(element.getAttribute("src")).append(")");

                case "strong":
                case "b":

                    return append("**").append(normalize(element.getTextContent())).append("**");

                case "em":
                case "i":

                    return append("*").append(normalize(element.getTextContent())).append("*");

                case "script": // preserve JSON-LD metadata

                    return "application/ld+json".equals(element.getAttribute("type"))
                            ? append("```json\n").append(normalize(element.getTextContent())).append("\n```").feed()
                            : this;

                case "head":
                case "style":

                    return this;

                default:

                    return format(element.getChildNodes());

            }
        }

        private Builder format(final Text text) {

            Optional.ofNullable(text.getNodeValue())
                    .map(s -> normalize(s, true)) // preserve border whitespace to handle misplaced emphasis tags
                    .ifPresent(this::append);

            return this;
        }


        private Builder append(final String string) {

            for (int n=0; n < string.length(); ++n) {

                final char c=string.charAt(n);

                switch ( c ) {

                    case ' ', '\t' -> space=true;

                    case '\n' -> {

                        builder.append(c);

                        space=false;
                    }

                    case '\r' -> space=false;

                    default -> {

                        if ( space ) {
                            builder.append(' ');
                        }

                        builder.append(c);

                        space=false;
                    }
                }
            }

            return this;
        }


        private Builder indent() {

            if ( indent++ == 0 ) { feed(); }

            return this;
        }

        private Builder outdent() {

            indent--;

            return this;
        }

        private Builder feed() {

            if ( builder.length() > 1 && builder.charAt(builder.length()-1) != '\n' ) {
                builder.append('\n');
            }

            if ( builder.length() > 2 && builder.charAt(builder.length()-2) != '\n' ) {
                builder.append('\n');
            }

            space=false;

            return this;
        }

        private Builder wrap() {

            if ( builder.length() > 1 && builder.charAt(builder.length()-1) != '\n' ) {
                builder.append('\n');
            }

            space=false;

            return this;
        }


        @Override public String toString() {
            return builder.toString();
        }

    }

}
