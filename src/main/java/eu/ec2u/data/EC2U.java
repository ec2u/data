/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data;

import org.eclipse.rdf4j.model.IRI;

import java.time.ZoneId;
import java.util.regex.Pattern;

import static com.metreeca.http.open.actions.Wikidata.wd;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.toolkits.Identifiers.md5;

public final class EC2U {

    public static final String Base="https://data.ec2u.eu/";
    public static final String Terms=Base + "terms/";
    public static final IRI College=term("College");
    public static final IRI Association=term("Association");
    public static final IRI City=term("City");

    private static final Pattern MD5Pattern=Pattern.compile("[a-f0-9]{32}");


    public static IRI item(final String name) {
        return iri(Base, name);
    }

    public static IRI item(final IRI dataset, final String name) {
        return iri(dataset, "/" + (MD5Pattern.matcher(name).matches() ? name : md5(name)));
    }

    public static IRI item(final IRI dataset, final University university, final String name) {
        return iri(dataset, "/"+(MD5Pattern.matcher(name).matches() ? name : md5(university.Id+"@"+name)));
    }

    public static IRI term(final String name) {
        return iri(Terms, name);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EC2U() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


        public final IRI Id;
        public final IRI City;
        public final IRI Country;
        public final String Language;
        public final ZoneId TimeZone;


        University(final IRI id, final IRI city, final IRI country, final String language, final ZoneId zone) {
            this.Id=id;
            this.City=city;
            this.Country=country;
            this.Language=language;
            this.TimeZone=zone;
        }

    }

}
