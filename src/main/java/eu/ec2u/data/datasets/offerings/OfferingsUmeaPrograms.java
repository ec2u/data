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

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.XML;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.programs.Programs;
import eu.ec2u.work.PageKeeper;

import java.net.URI;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static java.lang.String.format;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class OfferingsUmeaPrograms implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(OfferingsUmeaPrograms.class.getName()));


    public static void main(final String... args) {
        exec(() -> new OfferingsUmeaPrograms().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> Stream

                .of("https://www.umu.se/utbildning/sitemap.xml")

                .flatMap(optional(new GET<>(new XML())))
                .map(XPath::new)

                .flatMap(path -> path.links("""
                        //_:loc[
                            starts-with(., 'https://www.umu.se/utbildning/program/')
                            and not(contains(., '/utbildningsportrattvisningssida/'))
                        ]
                        """
                ))

                .flatMap(optional(lenient(URIs::uri)))

                .collect(collectingAndThen(toSet(), new PageKeeper<ProgramFrame>(PIPELINE)
                        .insert(page -> new Programs.Scanner().apply(page, new ProgramFrame().university(UMEA)))
                        .remove(page -> Optional.of(new ProgramFrame(true).id(page.resource()))
                )))

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }

}
