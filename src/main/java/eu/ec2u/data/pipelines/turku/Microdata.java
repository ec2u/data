/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.services.Logger;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.w3c.dom.*;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;

import static java.lang.String.format;
import static java.util.Collections.emptyMap;

public final class Microdata implements Function<Node, Stream<Frame>> {

	private static final String ItemScope="itemscope";
	private static final String ItemId="itemid";
	private static final String ItemType="itemtype";


	private static final Pattern SpacePattern=Pattern.compile("[\t\n\f\r ]+");


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Logger logger=service(logger());


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public Stream<Frame> apply(final Node node) {
		return node == null ? Stream.empty() : items(node, ids(node));
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Map<String, Node> ids(final Node node) {
		return emptyMap(); // !!!
	}


	private Stream<Frame> items(final Node node, final Map<String, Node> ids) {
		return node instanceof Document ? items(((Document)node), ids)
				: node instanceof Element ? items(((Element)node), ids)
				: Stream.empty();
	}

	private Stream<Frame> items(final Document document, final Map<String, Node> ids) {
		return items(document.getDocumentElement(), ids);
	}

	private Stream<Frame> items(final Element element, final Map<String, Node> ids) {

		final boolean scoped=element.hasAttribute(ItemScope);
		final boolean typed=element.hasAttribute(ItemType);
		final boolean identified=element.hasAttribute(ItemId);

		if ( typed && !scoped ) {
			logger.warning(this, "itemtype requires itemscope"); // !!! report open tag
		}

		if ( identified && !scoped ) {
			logger.warning(this, "itemid requires itemscope"); // !!! report open tag
		}

		if ( identified && !typed ) {
			logger.warning(this, "itemid requires itemtype"); // !!! report open tag
		}

		return scoped ? Stream.of(item(element, ids)) : Stream
				.of(element.getChildNodes())
				.flatMap(list -> IntStream.range(0, list.getLength()).mapToObj(list::item))
				.flatMap(node -> items(node, ids));
	}

	private Frame item(final Element element, final Map<String, Node> ids) {

		final Set<Node> visited=new HashSet<>();
		final Queue<Node> pending=new ArrayDeque<>();

		return frame(id(element))
				.values(RDF.TYPE, types(element));
	}


	private IRI id(final Element element) {
		return attribute(element, ItemId)

				.map(String::trim)
				.filter(value -> checkNotEmpty(ItemId, value))

				.map(id -> Optional.ofNullable(element.getBaseURI())

						.map(base -> {

							try { return URI.create(base); } catch ( final IllegalArgumentException e ) {

								logger.warning(this, format("malformed base URI <%s>", base));

								return null;

							}

						})

						.map(base -> {

							try { return base.resolve(id); } catch ( final IllegalArgumentException e ) {

								logger.warning(this, format("malformed itemid <%s>", id)); // !!! report open tag

								return null;

							}

						})

						.map(URI::toString)
						.orElse(id)
				)

				.filter(id -> checkAbsolute(ItemId, id))

				.map(Values::iri)
				.orElseGet(Values::iri);
	}


	private Stream<IRI> types(final Element element) {

		final AtomicReference<String> vocabulary=new AtomicReference<>();
		final Set<String> types=ConcurrentHashMap.newKeySet();

		return attribute(element, ItemType)

				.map(String::trim)
				.filter(value -> checkNotEmpty(ItemType, value))

				.stream()
				.flatMap(type -> Arrays.stream(SpacePattern.split(type)))

				.map(type -> {

					try { return iri(URI.create(type)); } catch ( final IllegalArgumentException e ) {

						logger.warning(this, format("malformed %s <%s>", ItemType, type));

						return null;

					}

				})

				.filter(Objects::nonNull)

				.peek(type -> {

					if ( !types.add(type.stringValue()) ) {
						logger.warning(this, format("duplicate itemtype <%s>", type.stringValue()));
					}

				})

				.peek(type -> vocabulary.accumulateAndGet(type.getNamespace(), (first, current) -> {

					if ( first == null || first.equals(current) ) {

						return current;

					} else {

						logger.warning(this, format("multiple itemtype vocabularies <%s>", type.stringValue()));

						return first;

					}

				}));
	}


	private Optional<String> attribute(final Element element, final String attribute) {
		return element.hasAttribute(attribute)
				? Optional.of(element.getAttribute(attribute))
				: Optional.empty();
	}


	private boolean checkNotEmpty(final String attribute, final String value) {
		if ( value.isEmpty() ) {

			logger.warning(this, format("empty %s", attribute)); // !!! report open tag

			return false;

		} else { return true; }
	}

	private boolean checkAbsolute(final String attribute, final String url) {
		if ( Values.AbsoluteIRIPattern.matcher(url).matches() ) { return true; } else {

			logger.warning(this, format("malformed %s <%s>", attribute, url)); // !!! report open tag

			return false;
		}
	}

}
