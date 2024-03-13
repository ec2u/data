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

import eu.ec2u.data._EC2U;
import org.eclipse.rdf4j.model.IRI;

import java.time.ZoneId;

import static com.metreeca.http.open.actions.Wikidata.wd;

public enum _Universities {

    Coimbra(
            _EC2U.item("/universities/coimbra"),
            wd("Q45412"),
            wd("Q45"),
            "pt",
            ZoneId.of("Europe/Lisbon")
    ),

    Iasi(
            _EC2U.item("/universities/iasi"),
            wd("Q46852"),
            wd("Q218"),
            "ro",
            ZoneId.of("Europe/Bucharest")
    ),

    Jena(
            _EC2U.item("/universities/jena"),
            wd("Q3150"),
            wd("Q183"),
            "de",
            ZoneId.of("Europe/Berlin")
    ),

    Pavia(
            _EC2U.item("/universities/pavia"),
            wd("Q6259"),
            wd("Q38"),
            "it",
            ZoneId.of("Europe/Rome")
    ),

    Poitiers(
            _EC2U.item("/universities/poitiers"),
            wd("Q6616"),
            wd("Q142"),
            "fr",
            ZoneId.of("Europe/Paris")
    ),

    Salamanca(
            _EC2U.item("/universities/salamanca"),
            wd("Q15695"),
            wd("Q29"),
            "es",
            ZoneId.of("Europe/Madrid")
    ),

    Turku(
            _EC2U.item("/universities/turku"),
            wd("Q38511"),
            wd("Q38511"),
            "fi",
            ZoneId.of("Europe/Helsinki")
    );


    public final IRI Id;
    public final IRI City;
    public final IRI Country;
    public final String Language;
    public final ZoneId TimeZone;


    _Universities(final IRI id, final IRI city, final IRI country, final String language, final ZoneId zone) {
        this.Id=id;
        this.City=city;
        this.Country=country;
        this.Language=language;
        this.TimeZone=zone;
    }

}
