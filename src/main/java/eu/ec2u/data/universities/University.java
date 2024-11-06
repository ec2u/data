/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data.universities;

import org.eclipse.rdf4j.model.IRI;

import java.time.ZoneId;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.lod.actions.Wikidata.wd;

import static eu.ec2u.data.EC2U.item;
import static java.util.stream.Collectors.toUnmodifiableSet;

public enum University {

    Coimbra(
            item("/universities/coimbra"),
            wd("Q45412"),
            wd("Q45"),
            "pt",
            ZoneId.of("Europe/Lisbon")
    ),

    Iasi(
            item("/universities/iasi"),
            wd("Q46852"),
            wd("Q218"),
            "ro",
            ZoneId.of("Europe/Bucharest")
    ),

    Jena(
            item("/universities/jena"),
            wd("Q3150"),
            wd("Q183"),
            "de",
            ZoneId.of("Europe/Berlin")
    ),

    Linz(
            item("/universities/linz"),
            wd("Q41329"),
            wd("Q40"),
            "de",
            ZoneId.of("Europe/Vienna")
    ),

    Pavia(
            item("/universities/pavia"),
            wd("Q6259"),
            wd("Q38"),
            "it",
            ZoneId.of("Europe/Rome")
    ),

    Poitiers(
            item("/universities/poitiers"),
            wd("Q6616"),
            wd("Q142"),
            "fr",
            ZoneId.of("Europe/Paris")
    ),

    Salamanca(
            item("/universities/salamanca"),
            wd("Q15695"),
            wd("Q29"),
            "es",
            ZoneId.of("Europe/Madrid")
    ),

    Turku(
            item("/universities/turku"),
            wd("Q38511"),
            wd("Q38511"),
            "fi",
            ZoneId.of("Europe/Helsinki")
    );


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final Set<String> Languages=Stream

            .concat(

                    Arrays.stream(values()).map(universities -> universities.language),
                    Stream.of("en")
            )

            .collect(toUnmodifiableSet());


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public final IRI id;
    public final IRI city;
    public final IRI country;
    public final String language;
    public final ZoneId zone;


    University(final IRI id, final IRI city, final IRI country, final String language, final ZoneId zone) {
        this.id=id;
        this.city=city;
        this.country=country;
        this.language=language;
        this.zone=zone;
    }

}
