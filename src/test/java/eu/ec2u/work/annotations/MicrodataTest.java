/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work.annotations;

import com.metreeca.json.Frame;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.services.Logger;
import com.metreeca.rest.services.Logger.Level;

import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.io.StringReader;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

import static com.metreeca.json.Values.iri;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static org.assertj.core.api.Assertions.assertThat;

import static java.util.stream.Collectors.toList;

// https://html.spec.whatwg.org/multipage/microdata.html

final class MicrodataTest {

	private boolean exec(final Runnable task) {

		final Logger logger=logger().get();
		final AtomicReference<Level> status=new AtomicReference<>(Level.info);

		new Toolbox()
				.set(logger(), () -> new Logger() {
					@Override public Logger entry(
							final Level level, final Object source,
							final Supplier<String> message, final Throwable cause
					) {

						logger.entry(level, source, message, cause);

						status.accumulateAndGet(level, (x, y) -> x.compareTo(y) >= 0 ? x : y);

						return this;
					}
				})
				.exec(task)
				.clear();

		return status.get().compareTo(Level.info) <= 0;
	}


	private Xtream<Frame> scan(final String document) {
		return Xtream.of(document)

				.optMap(html -> html(new StringReader(html), "http://example.net/").get())

				.flatMap(new Microdata());
	}

	private long test(final String document) {
		return scan(document).count();
	}


	@Nested final class ItemScope {

		@Test void testScanUnannotatedDocument() {
			exec(() -> assertThat(scan("<div></div>")).isEmpty());
		}

		@Test void testIdentifyTopLevelItems() {
			exec(() -> assertThat(scan("<div><div itemscope/><div itemscope/></div>")).hasSize(2));
		}

	}

	@Nested final class ItemId {

		// The itemid attribute, if specified, must have a value that is a valid URL potentially surrounded by spaces.

		@Test void testScanId() {
			exec(() -> assertThat(scan("<div itemscope"
					+" itemid=' http://example.net/id\t'"
					+" itemtype='https:/schema.org/Thing'"
					+"/>"))
					.extracting(Frame::focus)
					.containsExactly(iri("http://example.net/id"))
			);
		}

		@Test void testReportEmptyId() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemid=''"
					+" itemtype='https:/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}

		@Test void testReportMalformedID() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemid='http\t//example.net/id'"
					+" itemtype='https:/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}


		// The global identifier of an item is the value of its element's itemid attribute, if it has one, parsed
		// relative to the node document of the element on which the attribute is specified.

		@Test void testResolveId() {
			exec(() -> assertThat(scan(
					"<div itemscope"
							+" itemid='id'"
							+" itemtype='https:/schema.org/Thing'"
							+"/>"
					))
							.extracting(Frame::focus)
							.containsExactly(iri("http://example.net/id"))
			);
		}

		// If the itemid attribute is missing or if resolving it fails, it is said to have no global identifier.

		@Test void testGenerateUniqueFallbackId() {
			exec(() -> assertThat(scan("<div itemscope/>"))
					.extracting(Frame::focus)
					.extracting(Value::stringValue)
					.allMatch(id -> id.startsWith("urn:uuid:"))
			);
		}

		// The itemid attribute must not be specified on elements that do not have both an itemscope attribute and an
		// itemtype attribute specified

		@Test void testReportMissingScope() {
			assertThat(exec(() -> test("<div"
					+" itemid='http://example.net/id'"
					+" itemtype='https:/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}

		@Test void testReportMissingType() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemid='http://example.net/id'"
					+"/>"
			))).isFalse();
		}

	}

	@Nested final class ItemType {

		// The itemtype attribute, if specified, must have a value that is an unordered set of unique space-separated
		// tokens, none of which are identical to another token and each of which is a valid URL string that is an
		// absolute URL.

		@Test void testScanType() {
			exec(() -> assertThat(scan("<div itemscope"
					+" itemtype=' https:/schema.org/Thing\t\thttps:/schema.org/Event'"
					+"/>"))
					.flatExtracting(frame -> frame.values(RDF.TYPE).collect(toList()))
					.containsExactly(iri("https:/schema.org/Thing"), iri("https:/schema.org/Event"))
			);
		}

		@Test void testReportRepeatedType() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemtype='https:/schema.org/Thing https:/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}

		@Test void testHandleRepeatedType() {
			exec(() -> assertThat(scan("<div itemscope"
					+" itemtype='https:/schema.org/Thing https:/schema.org/Thing'"
					+"/>"))
					.flatExtracting(frame -> frame.values(RDF.TYPE).collect(toList()))
					.containsExactly(iri("https:/schema.org/Thing"))
			);
		}

		@Test void testReportRelativeType() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemtype='Thing'"
					+"/>"
			))).isFalse();
		}

		@Test void testReportMalformedType() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemtype='https\b/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}


		// The attribute's value must have at least one token.

		@Test void testReportEmptyType() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemtype='\t \t'"
					+"/>"
			))).isFalse();
		}

		// The item types must all be defined to use the same vocabulary.

		@Test void testReportMultipleVocabularies() {
			assertThat(exec(() -> test("<div itemscope"
					+" itemtype='https:/schema.org/Thing https://example.net/Type'"
					+"/>"
			))).isFalse();
		}

		// The itemtype attribute must not be specified on elements that do not have an itemscope attribute specified.

		@Test void testReportMissingScope() {
			assertThat(exec(() -> test("<div"
					+" itemtype='https:/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}

	}

	@Nested final class ItemProp {

	}

	@Nested final class ItemRef {

	}

}