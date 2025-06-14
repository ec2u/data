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

package eu.ec2u.data.datasets;

import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Id;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.MaxLength;
import com.metreeca.shim.Strings;

import java.net.URI;
import java.util.*;
import java.util.Map.Entry;

import static com.metreeca.shim.Collections.entry;
import static com.metreeca.shim.Collections.map;

import static eu.ec2u.data.datasets.Localized.LOCALES;
import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.reducing;

@Frame
@Namespace(prefix="rdfs", value="http://www.w3.org/2000/01/rdf-schema#")
public interface Reference {

    int LABEL_LENGTH=100;
    int COMMENT_LENGTH=500;

    String EMAIL_PATTERN="^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$";
    String PHONE_PATTERN="^\\+?[1-9]\\d{1,14}$";
    String LANGUAGE_PATTERN="^[a-z]{2}$";


    static boolean local(final Entry<Locale, String> text) {
        return LOCALES.contains(text.getKey());
    }


    @SafeVarargs
    static Map<Locale, String> label(final Map<Locale, String>... labels) {
        return clip(LABEL_LENGTH, labels);
    }

    @SafeVarargs
    static Map<Locale, String> comment(final Map<Locale, String>... comments) {
        return clip(COMMENT_LENGTH, comments);
    }


    @SafeVarargs
    static Map<Locale, String> clip(final int length, final Map<Locale, String>... texts) {
        return map(Arrays.stream(texts)
                .flatMap(m -> m.entrySet().stream())
                .map(e -> entry(e.getKey(), Strings.clip(e.getValue(), length)))
                .collect(groupingBy(Entry::getKey, reducing(null, Entry::getValue, (x, y) -> x == null ? y : x)))
        );
    }


    static Optional<String> email(final String text) {
        return Optional.of(text).filter(t -> t.matches(EMAIL_PATTERN));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Id
    URI id();


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
