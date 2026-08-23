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

package com.metreeca.flow.xml;

import com.metreeca.flow.Xtream;

import org.w3c.dom.*;

import javax.xml.namespace.NamespaceContext;
import javax.xml.namespace.QName;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.StreamSupport;

import static java.util.Map.entry;
import static java.util.regex.Pattern.CASE_INSENSITIVE;
import static javax.xml.XMLConstants.XMLNS_ATTRIBUTE;

/**
 * XPath processor.
 *
 * <p>Applies XPath expression to a target XML node.</p>
 */
public final class XPath {

    /**
     * The prefix mapped to the default namespace of the target document ({@value}).
     */
    private static final String DEFAULT_PREFIX="_";

    private static final String HTML_PREFIX="html";
    private static final String HTML_URI="http://www.w3.org/1999/xhtml";


    private static final Pattern SPACE_PATTERN=Pattern.compile("[ \\p{Cntrl}]+");

    private static final Pattern ENTITY_PATTERN=Pattern.compile(
            "&(?:#(?<hex>x?)(?<code>\\d+)|(?<name>\\w+));", CASE_INSENSITIVE
    );

    private static final Map<String, String> ENTITIES=Map.ofEntries(
            entry("amp", "&"),
            entry("lt", "<"),
            entry("gt", ">"),
            entry("quot", "\""),
            entry("apos", "'"),
            entry("nbsp", "\u00A0"),
            entry("ndash", "–"),
            entry("mdash", "—"),
            entry("copy", "©"),
            entry("reg", "®"),
            entry("trade", "™"),
            entry("pound", "£"),
            entry("euro", "€")
    );


    private static final XPathFactory FACTORY=XPathFactory.newInstance();


    /**
     * Decodes XML numeric and well-known named entities.
     *
     * @param text the text to be decoded
     *
     * @return a version of {@code text} where XML numeric entities (for instance,  {@code &#x2019;} or {@code &#8220;})
     *         and well-known named entities (for instance, {@code &amp;}) are replaced with the corresponding Unicode
     *         characters
     *
     * @throws NullPointerException if {@code text} is null
     * @see <a href="https://developer.mozilla.org/en-US/docs/Glossary/Entity#reserved_characters">Entity - Reserved
     *         characters @ MDN</a>
     */
    public static String decode(final CharSequence text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        final StringBuffer buffer=new StringBuffer(text.length());
        final Matcher matcher=ENTITY_PATTERN.matcher(text);

        while ( matcher.find() ) {

            matcher.appendReplacement(buffer, "");

            final String hex=matcher.group("hex");
            final String code=matcher.group("code");
            final String name=matcher.group("name");

            if ( code != null ) {

                buffer.append(Character.toChars(
                        Integer.parseInt(code, hex.isEmpty() ? 10 : 16)
                ));

            } else {

                buffer.append(ENTITIES.getOrDefault(name, ""));

            }

        }

        matcher.appendTail(buffer);

        return buffer.toString();
    }


    /**
     * Normalizes spaces.
     *
     * @param string the string to be normalized
     *
     * @return a copy of {@code string} where leading and trailing sequences of control and space characters are removed
     *         and other sequences replaced with a single space character
     *
     * @throws NullPointerException if {@code string} is null
     */
    public static String normalize(final String string) {

        if ( string == null ) {
            throw new NullPointerException("null string");
        }

        return normalize(string, false);
    }

    /**
     * Normalizes spaces.
     *
     * @param string the string to be normalized
     * @param border {@code true} if leading/trailing whitespace is to be retained; {@code false} otherwise
     *
     * @return a copy of {@code string} where leading and trailing sequences of control and space characters are removed
     *         and other sequences replaced with a single space character
     *
     * @throws NullPointerException if {@code string} is null
     */
    public static String normalize(final String string, final boolean border) {

        if ( string == null ) {
            throw new NullPointerException("null string");
        }

        return string.isEmpty() ? string
                : SPACE_PATTERN.matcher(border ? string : string.trim()).replaceAll(" ");
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Node node;
    private final URI base;

    private final javax.xml.xpath.XPath xpath;


    /**
     * Creates an XPath processor.
     *
     * @param node the target XML node for the processor
     *
     * @throws NullPointerException if {@code node} is null
     */
    public XPath(final Node node) {

        if ( node == null ) {
            throw new NullPointerException("null node");
        }

        this.xpath=FACTORY.newXPath();

        final Map<String, String> namespaces=new HashMap<>();

        final Node root=node instanceof Document ? ((Document)node).getDocumentElement() : node;

        for (Node scope=root; scope != null; scope=scope.getParentNode()) {

            final NamedNodeMap attributes=scope.getAttributes();

            if ( attributes != null ) {
                for (int i=0, n=attributes.getLength(); i < n; ++i) {

                    final Node attribute=attributes.item(i);

                    if ( XMLNS_ATTRIBUTE.equals(attribute.getNodeName()) ) { // default namespace

                        namespaces.putIfAbsent(DEFAULT_PREFIX, attribute.getNodeValue());

                    } else if ( XMLNS_ATTRIBUTE.equals(attribute.getPrefix()) ) { // prefixed namespace

                        namespaces.putIfAbsent(attribute.getLocalName(), attribute.getNodeValue());

                    }

                }
            }

        }

        final String namespace=root.getNamespaceURI();

        namespaces.computeIfAbsent(DEFAULT_PREFIX, prefix -> namespace);
        namespaces.computeIfAbsent(HTML_PREFIX, prefix -> HTML_URI.equals(namespace) ? namespace : null);

        xpath.setNamespaceContext(new NamespaceContext() {

            @Override public String getNamespaceURI(final String prefix) {
                return namespaces.get(prefix);
            }

            @Override public String getPrefix(final String namespaceURI) {
                throw new UnsupportedOperationException("prefix lookup");
            }

            @Override public Iterator<String> getPrefixes(final String namespaceURI) {
                throw new UnsupportedOperationException("prefixes lookup");
            }

        });

        this.node=node;
        this.base=Optional

                .ofNullable(Optional.of(root)

                        .filter(r -> HTML_URI.equals(r.getNamespaceURI()))

                        .map(r -> {
                            try {

                                return (String)xpath
                                        .compile("/html:html/html:head/html:base/@href")
                                        .evaluate(r, XPathConstants.STRING);

                            } catch ( final XPathExpressionException e ) {
                                return null;
                            }
                        })

                        .filter(href -> !href.isEmpty())
                        .orElse(node.getBaseURI())
                )

                .map(uri -> {

                    try {

                        return new URI(uri);

                    } catch ( final URISyntaxException e ) {
                        return null;
                    }

                })

                .map(uri -> { // remove query string and hash

                    try {

                        return new URI(uri.getScheme(), uri.getAuthority(), uri.getPath(), null, null);

                    } catch ( final URISyntaxException e ) {
                        return null;
                    }

                })

                .orElse(null);

    }


    /**
     * Retrieves the target node.
     *
     * @return the target node of this processor.
     */
    public Node node() {
        return node;
    }

    /**
     * Retrieves the target document.
     *
     * @return the target document of this processor.
     */
    public Document document() {
        return node instanceof Document ? (Document)node : node.getOwnerDocument();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Retrieves a boolean value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional boolean containing the value produced by evaluating {@code xpath} against the target node
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<Boolean> bool(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return Optional.of((Boolean)evaluate(xpath, XPathConstants.BOOLEAN));
    }

    /**
     * Retrieves a numeric value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional number containing the value produced by evaluating {@code xpath} against the target node, if
     *         one was available; an empty optional, otherwise
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<Double> number(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return Optional.of((Double)evaluate(xpath, XPathConstants.NUMBER)).filter(x -> !Double.isNaN(x));
    }


    /**
     * Retrieves a textual value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional non-empty string containing the value produced by evaluating {@code xpath} against the target
     *         node, if one was available and not empty; an empty optional, otherwise
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<String> string(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return Optional.of((String)evaluate(xpath, XPathConstants.STRING)).filter(s -> !s.isEmpty());
    }

    /**
     * Retrieves textual values from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return a stream of non-empty strings containing the values produced by evaluating {@code xpath} against the
     *         target node
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Xtream<String> strings(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return nodes(xpath).map(Node::getTextContent).filter(s -> !s.isEmpty());
    }


    /**
     * Retrieves a URI value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional string URIs containing the values produced by evaluating {@code xpath} against the target
     *         node, if one was available, and resolving it against the {@linkplain Node#getBaseURI() base URI} of the
     *         target node, if available; syntactically malformed URIs are returned verbatim
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<String> link(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return node(xpath).map(Node::getTextContent).map(this::resolve);
    }

    /**
     * Retrieves URI values from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return a stream of URIs containing the values produced by evaluating {@code xpath} against the target node and
     *         resolving them against the {@linkplain Node#getBaseURI() base URI} of the target node, if available;
     *         syntactically malformed URIs are returned verbatim
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Xtream<String> links(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return nodes(xpath).map(Node::getTextContent).map(this::resolve);
    }


    /**
     * Retrieves an element value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional element containing the value produced by evaluating {@code xpath} against the target node, if
     *         one was available; an empty optional, otherwise
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<Element> element(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return node(xpath)
                .filter(Element.class::isInstance)
                .map(Element.class::cast);
    }

    /**
     * Retrieves element values from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return a stream of elements containing the values produced by evaluating {@code xpath} against the target node
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Xtream<Element> elements(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return nodes(xpath)
                .filter(Element.class::isInstance)
                .map(Element.class::cast);
    }


    /**
     * Retrieves an XPath processor value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional XPath processor targeting the value generated by evaluating {@code xpath} against the current
     *         target node, if one was available; an empty optional, otherwise
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<XPath> path(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return node(xpath)
                .map(XPath::new);
    }

    /**
     * Retrieves XPath processors from the target value.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return a stream of XPath processors targeting nodes generated by evaluating {@code xpath} against the target
     *         node
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Xtream<XPath> paths(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return nodes(xpath)
                .map(XPath::new);
    }


    /**
     * Retrieves a node value from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return an optional node containing the value produced by evaluating {@code xpath} against the target node, if
     *         one was available; an empty optional, otherwise
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Optional<Node> node(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return Optional.ofNullable((Node)evaluate(xpath, XPathConstants.NODE));
    }

    /**
     * Retrieves node values from the target node.
     *
     * @param xpath the XPath expression to be evaluated against the target node
     *
     * @return a stream of nodes containing the values produced by evaluating {@code xpath} against the target node
     *
     * @throws NullPointerException if {@code xpath} is null
     */
    public Xtream<Node> nodes(final String xpath) {

        if ( xpath == null ) {
            throw new NullPointerException("null XPath expression");
        }

        return Xtream.from(StreamSupport.stream(Spliterators.spliteratorUnknownSize(new Iterator<Node>() {

            private final NodeList nodes=(NodeList)evaluate(xpath, XPathConstants.NODESET);

            private int next;

            @Override public boolean hasNext() {
                return next < nodes.getLength();
            }

            @Override public Node next() throws NoSuchElementException {

                if ( !hasNext() ) {
                    throw new NoSuchElementException("no more iterator elements");
                }

                return nodes.item(next++);

            }

        }, Spliterator.ORDERED), false));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Object evaluate(final String query, final QName type) {
        try {

            return xpath.compile(query).evaluate(node, type);

        } catch ( final XPathExpressionException e ) {
            throw new RuntimeException(String.format("unable to evaluate XPath expression {%s}", query), e);
        }
    }

    private String resolve(final String link) {
        try {

            return base == null ? link
                    : link.startsWith("?") ? base+link
                    : base.resolve(link).normalize().toString();

        } catch ( final IllegalArgumentException e ) {

            return link;

        }
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public boolean equals(final Object object) {
        return this == object || object instanceof XPath
                                 && node.equals(((XPath)object).node);
    }

    @Override public int hashCode() {
        return node.hashCode();
    }

    @Override public String toString() {
        return node.toString();
    }

}
