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

package eu.ec2u.data.resources;

import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Id;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.MaxLength;
import com.metreeca.mesh.meta.shacl.Required;

import java.net.URI;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import static com.metreeca.flow.toolkits.Strings.clip;
import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.map;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.reducing;

@Frame
@Namespace(prefix="rdfs", value="http://www.w3.org/2000/01/rdf-schema#")
public interface Reference {

    int LABEL_LENGTH=100;
    int COMMENT_LENGTH=500;

    String EMAIl_PATTERN="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    String PHONE_PATTERN="^\\+?[1-9]\\d{1,14}$";


    static String label(final String label) {
        return clip(label, LABEL_LENGTH);
    }

    static String comment(final String comment) {
        return clip(comment, COMMENT_LENGTH);
    }


    @SafeVarargs
    static Map<Locale, String> label(final Map<Locale, String>... labels) {
        return map(Arrays.stream(labels)
                .flatMap(m -> m.entrySet().stream())
                .map(e -> entry(e.getKey(), label(e.getValue())))
                .collect(groupingBy(Entry::getKey, reducing(null, Entry::getValue, (x, y) -> x == null ? y : x)))
        );
    }

    @SafeVarargs
    static Map<Locale, String> comment(final Map<Locale, String>... labels) {
        return map(Arrays.stream(labels)
                .flatMap(m -> m.entrySet().stream())
                .map(e -> entry(e.getKey(), comment(e.getValue())))
                .collect(groupingBy(Entry::getKey, reducing(null, Entry::getValue, (x, y) -> x == null ? y : x)))
        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Id
    URI id();


    @Required
    @Localized
    @MaxLength(LABEL_LENGTH)
    @Forward("rdfs:")
    Map<Locale, String> label();

    @Localized
    @MaxLength(COMMENT_LENGTH)
    @Forward("rdfs:")
    Map<Locale, String> comment();


    @Forward("rdfs:")
    @SuppressWarnings("NonBooleanMethodNameMayNotStartWithQuestion")
    URI isDefinedBy();

    @Forward("rdfs:")
    Set<URI> seeAlso();

}
