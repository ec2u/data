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

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

import static com.metreeca.json.Values.*;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static org.assertj.core.api.Assertions.assertThat;

import static java.nio.charset.StandardCharsets.UTF_8;
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

				.optMap(html -> html(new ByteArrayInputStream(html.getBytes(UTF_8)), UTF_8.name(), "http://example"
						+ ".net/").get())

				.flatMap(new Microdata());
	}

	private long test(final String document) {
		return scan(document).count();
	}


	@Nested final class ItemScope {

		@Test void testScanUnannotatedDocument() {
			exec(() -> assertThat(scan("<div></div>")).isEmpty());
		}

		@Test void testScanTopLevelItems() {
			exec(() -> assertThat(scan("<div><div itemscope/><div itemscope/></div>")).hasSize(2));
		}

		@Test void testScanNestedUnlinkedItems() {
			exec(() -> assertThat(scan("<div itemscope><div itemscope></div></div>")).hasSize(2));
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

		@Test void testReportOutsideScope() {
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

		@Test void testReportOutsideScope() {
			assertThat(exec(() -> test("<div"
					+" itemtype='https:/schema.org/Thing'"
					+"/>"
			))).isFalse();
		}

	}

	@Nested final class ItemPropName {

		// The itemprop attribute, if specified, must have a value that is an unordered set of unique space-separated
		// tokens none of which are identical to another token, representing the names of the name-value pairs that it
		// adds.

		@Test void testScanProps() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<span itemprop='x y'>value</span>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.traits().keySet())
							.containsExactly(term("x"), term("y"))
			);
		}

		@Test void testReportOutsideScope() {
			assertThat(exec(() -> test("<div"
					+" itemprop='name'"
					+"/>"
			))).isFalse();
		}

		@Test void testReportRepeatedProp() {
			assertThat(exec(() -> test("<div"
					+" itemprop='name name'"
					+"/>"
			))).isFalse();
		}


		// The attribute's value must have at least one token.

		@Test void testReportEmptyProp() {
			assertThat(exec(() -> test("<div itemscope>"
					+"<span itemprop='\t \t'>value</span>"
					+"</div>"
			))).isFalse();
		}


		// If the item is a typed item: each token must be either a defined property name allowed in this situation
		// according to the specification that defines the relevant types for the item, or a valid URL string that is an
		// absolute URL


		// If the item is not a typed item, each token must be a string that contains no U+002E FULL STOP characters (.)
		// and no U+003A COLON characters (:), used as a proprietary item property name (i.e. one used by the author
		// for private purposes, not defined in a public specification).


		// When an element with an itemprop attribute adds a property to multiple items, the requirement above
		// regarding the tokens applies for each item individually.


		// The property names of an element are the tokens that the element's itemprop attribute is found to contain
		// when its value is split on ASCII whitespace, with the order preserved but with duplicates removed (leaving
		// only the first occurrence of each name).

		@Test void testHandleRepeatedProp() {
		}


		// Within an item, the properties are unordered with respect to each other, except for properties with the same
		// name, which are ordered in the order they are given by the algorithm that defines the properties of an item.

	}

	@Nested final class ItemPropValue {

		// If the element also has an itemscope attribute The value is the item created by the element.

		@Test void testScanItem() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<span itemprop='name' itemscope"
							+" itemid='http://example.net/id'"
							+" itemtype='https:/schema.org/Thing'"
							+"/>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(iri("http://example.net/id"))
			);
		}

		@Test void testScanItemNested() {
			exec(() -> assertThat(scan("<div itemscope>\n"
					+"\t<address itemprop='address' itemscope\n"
					+"\t\t\titemtype='https://schema.org/PostalAddress'\n"
					+"\t\t\titemid='https://example.net/address'\n"
					+"\t>\n"
					+"\t\t<div>\n"
					+"\t\t\t<span itemprop='streetAddress'>address</span>\n"
					+"\t\t</div>\n"
					+"\t</address>\n"
					+"</div>"))

					.flatMap(frame -> frame.model().collect(toList())).contains(statement(
							iri("https://example.net/address"),
							Schema.term("streetAddress"),
							literal("address")
					)));
		}


		// If the element is a meta element The value is the value of the element's content attribute, if any, or the
		// empty string if there is no such attribute.

		@Test void testScanMeta() {
			exec(() -> assertThat(scan("<head itemscope>"
							+"<meta itemprop='name' content='value'>"
							+"</head>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal("value"))
			);
		}

		@Test void testReportEmptyMeta() {
			assertThat(exec(() -> assertThat(scan("<head itemscope>\n"
							+"\t<meta itemprop='name'>\n"
							+"<head/>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()

			)).isFalse();
		}


		// If the element is an audio, embed, iframe, img, source, track, or video element The value is the resulting
		// URL string that results from parsing the value of the element's src attribute relative to the node document
		// of the element at the time the attribute is set, or the empty string if there is no such attribute or if
		// parsing it results in an error.

		@Test void testScanImg() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<img itemprop='name' src='id'>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(iri("http://example.net/id"))
			);
		}

		@Test void testIgnoreEmptyImg() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<img itemprop='name' src='\t'>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}

		@Test void testReportMalformedImg() {
			assertThat(exec(() -> assertThat(scan("<div itemscope>"
							+"<img itemprop='name' src='/ /'>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()

			)).isFalse();
		}


		// If the element is an a, area, or link element The value is the resulting URL string that results from
		// parsing the value of the element's href attribute relative to the node document of the element at the time
		// the attribute is set, or the empty string if there is no such attribute or if parsing it results in an error.

		@Test void testScanA() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<a itemprop='name' href='id'>value</a>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(iri("http://example.net/id"))
			);
		}

		@Test void testIgnoreEmptyA() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<a itemprop='name' href='\t'>value</a>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}

		@Test void testReportMalformedA() {
			assertThat(exec(() -> assertThat(scan("<div itemscope>"
							+"<a itemprop='name' href='/ /'>value</a>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()

			)).isFalse();
		}


		// If the element is an object element The value is the resulting URL string that results from parsing the
		// value of the element's data attribute relative to the node document of the element at the time the attribute
		// is set, or the empty string if there is no such attribute or if parsing it results in an error.

		@Test void testScanObject() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<object itemprop='name' data='id'>value</object>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(iri("http://example.net/id"))
			);
		}

		@Test void testIgnoreEmptyObject() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<object itemprop='name' data='\t'>value</object>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}

		@Test void testReportMalformedObject() {
			assertThat(exec(() -> assertThat(scan("<div itemscope>"
							+"<object itemprop='name' data='/ /'>value</object>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()

			)).isFalse();
		}


		// If the element is a data element The value is the value of the element's value attribute, if it has one, or
		// the empty string otherwise.

		@Test void testScanData() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<data itemprop='name' value='value'>text</data>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal("value"))
			);
		}

		@Test void testIgnoreEmptyData() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<data itemprop='name' value='\t'>text</data>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}


		// If the element is a meter element The value is the value of the element's value attribute, if it has one, or
		// the empty string otherwise.

		@Test void testScanMeter() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<meter itemprop='name' value='0.1'>text</meter>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal(0.1))
			);
		}

		@Test void testIgnoreEmptyMeter() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<meter itemprop='name' value='\t'>text</meter>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}

		@Test void testIgnoreMalformedMeter() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<meter itemprop='name' value='---'>text</meter>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}


		// If the element is a time element The value is the element's datetime value.

		@Test void testScanTimeAttribute() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<time itemprop='name' datetime='2021-07-18'>text</time>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal(LocalDate.of(2021, 7, 18)))
			);
		}

		@Test void testScanTimeText() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<time itemprop='name'>2021-07-18</time>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal(LocalDate.of(2021, 7, 18)))
			);
		}

		@Test void testIgnoreEmptyTime() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<time itemprop='name' datetime='\t'>\t</time>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}

		@Test void testReportMalformedTime() {
			assertThat(exec(() -> assertThat(scan("<div itemscope>"
							+"<time itemprop='name' datetime='malformed'>text</time>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal("malformed"))
			)).isFalse();
		}


		// Otherwise The value is the element's descendant text content.

		@Test void testScanOther() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<span itemprop='name'>value</span>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal("value"))
			);
		}

		@Test void testIgnoreEmptyOther() {
			exec(() -> assertThat(scan("<div itemscope>"
							+"<span itemprop='name'></span>"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.isEmpty()
			);
		}

	}

	@Nested final class ItemRef {

		@Test void testTraverseRefs() {
			exec(() -> assertThat(scan("<div>\n"
							+"\t<div id='name' itemprop='name'>value</div>\n"
							+"\t<div itemscope itemref='name'></div>\n"
							+"</div>"
					))
							.flatExtracting(frame -> frame.values(term("name")).collect(toList()))
							.containsExactly(literal("value"))
			);
		}

		@Test void testIgnorePropsInsideReferencedIds() {
			assertThat(exec(() -> test("<div>\n"
					+"\t<div id='name' itemprop='name'>value</div>\n"
					+"\t<div itemscope itemref='name'></div>\n"
					+"</div>"
			))).isTrue();
		}

		@Test void testReportPropsInsideUnreferencedIds() {
			assertThat(exec(() -> test("<div>\n"
					+"\t<div id='name' itemprop='name'>value</div>\n"
					+"</div>"
			))).isFalse();
		}

		@Test void testReportOutsideScope() {
			assertThat(exec(() -> test("<div>\n"
					+"\t<div id='name'></div>\n"
					+"\t<div itemref='name'></div>\n"
					+"</div>"
			))).isFalse();
		}

		@Test void testReportEmptyRef() {
			assertThat(exec(() -> test("<div itemscope>\n"
					+"\t<span itemscope itemref=''></span>\n"
					+"</div>"
			))).isFalse();
		}

		@Test void testReportUndefinedRef() {
			assertThat(exec(() -> test("<div itemscope>\n"
					+"\t<span itemscope itemref='name'></span>\n"
					+"</div>"
			))).isFalse();
		}

	}

}