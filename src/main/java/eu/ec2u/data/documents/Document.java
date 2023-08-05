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

package eu.ec2u.data.documents;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Namespace;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.MaxLength;
import com.metreeca.link.shacl.Pattern;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.concepts.Concept;
import eu.ec2u.data.persons.Person;
import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;

import java.net.URI;
import java.time.LocalDate;
import java.util.Set;

import static com.metreeca.link.Frame.with;
import static com.metreeca.link.Local.local;

@Type
@Getter
@Setter
@Namespace("dct:")
public final class Document extends Resource {

    public static final String Valid="\\d{4}(?:/\\d{4})?";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Property("schema:url")
    private Set<URI> urls;

    private String identifier;

    @Property("language")
    private Set<String> languages;


    @Required
    @MaxLength(100)
    private Local<String> title;

    @MaxLength(1000)
    private Local<String> description;

    private LocalDate issued;
    private LocalDate modified;

    @Pattern(Valid)
    private String valid;


    @Property("creator")
    private Set<Person> creators;

    @Property("contributor")
    private Set<Person> contributors;


    private String license;
    private String rights;


    @Property("type")
    private Set<Concept> types; // !!! concept stem

    @Property("subject")
    private Set<Concept> subjects; // !!! concept stem

    @Property("audience")
    private Set<Concept> audiences; // !!! concept stem


    @Property("relation")
    private Set<Document> relations;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker()

                    .get(new Relator(with(new Document(), document -> {

                        document.setId("");
                        document.setLabel(local("*", ""));

                    })))

            );
        }

    }

}
