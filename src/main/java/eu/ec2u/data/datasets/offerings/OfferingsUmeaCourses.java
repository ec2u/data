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

package eu.ec2u.data.datasets.offerings;

import com.metreeca.flow.services.Logger;

import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.courses.Courses;
import eu.ec2u.work.PageKeeper;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static java.lang.String.format;

public final class OfferingsUmeaCourses implements Runnable {

    private static final String LABEL="kurs";

    private static final URI PIPELINE=uri("java:%s".formatted(OfferingsUmeaCourses.class.getName()));

    private static final int BATCH=10; // pages fetched concurrently and committed as a single checkpoint
    private static final int RETRIES=3;

    private static final Duration TTL=Duration.ofDays(30);
    private static final Duration BUDGET=Duration.ofSeconds(30); // leaves room for the last batch to complete


    public static void main(final String... args) {
        exec(() -> new OfferingsUmeaCourses().sync(Optional.empty())); // no budget: drain the queue
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override
    public void run() {
        sync(Optional.of(BUDGET));
    }


    private void sync(final Optional<Duration> budget) {

        final Map<URI, Instant> stamps=OfferingsUmea.stamps(LABEL);

        final PageKeeper<CourseFrame> keeper=new PageKeeper<CourseFrame>(PIPELINE)

                .batch(BATCH)
                .retries(RETRIES)
                .ttl(TTL)

                .stamps(stamps)

                .insert(page -> new Courses.Scanner().apply(page, new CourseFrame().university(UMEA)))
                .remove(page -> Optional.of(new CourseFrame(true).id(page.resource())));

        time(() -> budget

                .map(keeper::budget)
                .orElse(keeper)

                .apply(stamps.keySet())

        ).apply((elapsed, values) -> logger.info(this, format(
                "synced <%,d> values in <%,d> ms", values, elapsed
        )));
    }

}
