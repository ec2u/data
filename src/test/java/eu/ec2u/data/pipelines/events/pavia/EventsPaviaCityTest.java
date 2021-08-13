/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events.pavia;

import com.metreeca.json.Frame;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;

import eu.ec2u.work.link.*;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.work.Work.exec;

final class EventsPaviaCityTest {

	@Test void test() {
		exec(() -> {
					Xtream

							.of(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))) // !!! last update

							.flatMap(new Fill<String>()
									.model("http://www.vivipavia.it/site/cdq/listSearchArticle.jsp"
											+"?new=yes"
											+"&instance=10"
											+"&channel=34"
											+"&size=9999"
											+"&node=4613"
											+"&fromDate=%{date}"
									)
									.value("date")
							)

							.optMap(new Query())
							.optMap(new Fetch())
							.optMap(new Parse<>(html()))

							.flatMap(new Microdata())

							.map(frame -> frame(frame.focus(),
									Schema.normalize(frame.model()).collect(Collectors.toList())))

							.filter(frame -> frame.values(RDF.TYPE).anyMatch(type -> type.equals(Schema.Event)))
							.flatMap(frame -> frame.values(Schema.term("url")))
							.map(Value::stringValue)

							.skip(10)
							.limit(1) // !!!

							.optMap(new Query())
							.optMap(new Fetch())
							.optMap(new Parse<>(html()))

							.flatMap(new Microdata())

							.flatMap(Frame::model)

							.map(new NormalizeDate())

							.batch(0)

							.map(new Report())

							.forEach(System.out::println);
				}

		);
	}

}