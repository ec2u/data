/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events;

import com.metreeca.json.Frame;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;

import eu.ec2u.work.annotations.Microdata;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.work.Work.exec;

final class EventsPaviaCityTest {

	@Test void test() {
		exec(() -> Xtream

				.of(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))

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

				.flatMap(Frame::model)

				.forEach(System.out::println)

		);
	}
}