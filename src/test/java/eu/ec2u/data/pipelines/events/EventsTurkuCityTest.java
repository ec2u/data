/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static eu.ec2u.data.pipelines.Work.exec;

import static java.time.ZoneOffset.UTC;

final class EventsTurkuCityTest {

	@Test void test() {
		exec(new EventsTurkuCity(LocalDate // !!! last update
				.of(2021, 8, 1)
				.atStartOfDay(UTC)
				.toInstant()
		));
	}

}