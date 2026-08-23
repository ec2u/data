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

import com.metreeca.flow.xml.XPath;

import org.w3c.dom.*;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.util.Collection;
import java.util.HashSet;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.xml.XPath.normalize;

import static java.util.Arrays.asList;
import static java.util.Comparator.comparingDouble;

/**
 * Main X/HTML content focusing.
 *
 * <p>Identifies and extracts the X/HTML node containing the main textual content of a complex page,
 * removing boilerplate elements like navigation, headers, footers, and sidebars.</p>
 *
 * <p>Uses a two-stage approach:</p>
 * <ol>
 *   <li>Semantic detection: looks for {@code <main>}, {@code <article>}, or elements with {@code role="main"}</li>
 *   <li>Content density scoring: calculates effective character density to find the most content-rich element</li>
 * </ol>
 *
 * <p>The scoring algorithm assigns higher scores to elements containing more textual content
 * and weights container elements based on their ratio of textual to non-textual child elements.</p>
 */
public final class Focus implements Function<Node, Optional<Node>> {

    private static final Collection<String> TEXTUAL=new HashSet<>(asList(
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "blockquote", "pre",
            "ul", "ol", "dl", "li", "dt", "dd",
            "table", "th", "td",
            "article", "section", "div", "span",
            "em", "strong", "b", "i", "u", "mark",
            "a", "time", "address", "cite", "q",
            "code", "kbd", "samp", "var",
            "small", "sub", "sup", "del", "ins"
    ));

    private static final Collection<String> IGNORED=new HashSet<>(asList(
            "style", "script", "noscript",
            "nav", "header", "footer", "aside",
            "menu", "menuitem", "toolbar",
            "iframe", "embed", "object", "applet",
            "form", "input", "button", "select", "textarea", "label", "fieldset", "legend",
            "canvas", "svg", "audio", "video", "track", "source"
    ));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Identifies the main content area within an X/HTML document.
     *
     * <p>First attempts semantic detection using HTML5 landmarks and ARIA roles.
     * If no semantic markers are found, falls back to content density analysis to identify the element with the highest
     * concentration of textual content.</p>
     *
     * @param root the root node of the X/HTML document to process
     *
     * @return an {@link Optional} containing a new {@link Document} with the main content, or {@link Optional#empty()}
     *         if no content is found or root is null
     *
     * @throws RuntimeException if document creation fails
     */
    @Override
    public Optional<Node> apply(final Node root) {
        if ( root == null ) { return Optional.empty(); } else {

            return new XPath(root).node(".//main")
                    .or(() -> new XPath(root).node(".//article"))
                    .or(() -> new XPath(root).node(".//*[@role='main']"))

                    .or(() -> Stream
                            .of(annotate(root))
                            .map(XPath::new)
                            .flatMap(xpath -> xpath.nodes(".//*"))
                            .max(comparingDouble(value -> get(value, "echars", 0.0)))
                    )

                    .map(node -> {

                        try {

                            // create a new document to provide a root for xpath queries

                            final Document document=DocumentBuilderFactory
                                    .newInstance()
                                    .newDocumentBuilder()
                                    .newDocument();

                            document.setDocumentURI(node.getBaseURI());
                            document.appendChild(document.adoptNode(node.cloneNode(true)));
                            document.normalizeDocument();

                            return document;

                        } catch ( final ParserConfigurationException unexpected ) {
                            throw new RuntimeException(unexpected);
                        }

                    });

        }
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Recursively annotates nodes with content scoring metadata.
     *
     * <p>Traverses the DOM tree and calculates content density scores for each element.
     * Scores are stored as user data on nodes and used to identify the most content-rich area.</p>
     *
     * <p>Scoring strategy:</p>
     *
     * <ul>
     *   <li>Text nodes: score = (normalized text length)²</li>
     *   <li>Leaf textual elements: score = sum of child text scores</li>
     *   <li>Container elements: score = weighted by ratio of textual to total children</li>
     * </ul>
     *
     * @param node the node to annotate with scoring data
     * @param <T>  the specific node type
     *
     * @return the same node with scoring annotations applied
     */
    private <T extends Node> T annotate(final T node) {

        if ( node instanceof Document ) {

            ((Document)node).normalizeDocument();

            annotate(((Document)node).getDocumentElement());

        } else if ( node instanceof Element && !IGNORED.contains(node.getNodeName()) ) {

            double xchars=0;  // raw character count (squared for text nodes)
            double echars=0;  // effective character count (content density score)

            int nodes=0;  // count of child elements
            int blobs=0;  // count of textual child elements

            final NodeList children=node.getChildNodes();

            for (int i=0, n=children.getLength(); i < n; ++i) {

                final Node child=annotate(children.item(i));

                xchars+=get(child, "xchars", 0.0);
                echars+=get(child, "echars", 0.0);

                if ( child instanceof Element ) { ++nodes; }
                if ( TEXTUAL.contains(child.getNodeName()) ) { ++blobs; }

            }

            // leaf textual elements get full score; containers get weighted score based on textual density

            final boolean text=TEXTUAL.contains(node.getNodeName()) && echars == 0;

            set(node, "xchars", xchars);

            // content density formula: text nodes get full score, containers get score weighted by textual child ratio

            set(node, "echars", text ? xchars : echars*(blobs+1)/(nodes+1));

            ((Element)node).setAttribute("chars", String.format("%.1f/%.0f",
                    get(node, "echars", 0.0),
                    get(node, "xchars", 0.0)
            ));

        } else if ( node instanceof Text ) {

            final double length=normalize(node.getTextContent()).length();

            // square the length to give preference to longer text blocks

            set(node, "xchars", length*length);

        }

        return node;

    }


    /**
     * Retrieves user data from a node with a default fallback value.
     *
     * @param node  the node to retrieve data from
     * @param label the data key to look up
     * @param value the default value if no data is found
     * @param <T>   the type of the value
     *
     * @return the stored value or the default if not found
     *
     * @throws NullPointerException if {@code node} or {@code label} is {@code null}
     */
    @SuppressWarnings("unchecked")
    private <T> T get(final Node node, final String label, final T value) {
        return Optional.ofNullable((T)node.getUserData(label)).orElse(value);
    }

    /**
     * Stores user data on a node for later retrieval.
     *
     * <p>Used to attach content scoring metadata to DOM nodes during the annotation phase.
     * The data is stored with no user data handler, so it will not be preserved across document operations like
     * cloning.</p>
     *
     * @param node  the node to store data on
     * @param label the data key
     * @param value the value to store
     * @param <T>   the type of the value
     *
     * @throws NullPointerException if {@code node} or {@code label} is {@code null}
     */
    private <T> void set(final Node node, final String label, final T value) {
        node.setUserData(label, value, null);
    }

}
