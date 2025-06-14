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

import com.metreeca.mesh.meta.shacl.Alias;
import com.metreeca.mesh.meta.shacl.LanguageIn;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.util.Locale;
import java.util.Set;

import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.Locales.locale;

import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target(METHOD)
@Retention(RUNTIME)
@Alias(

        LanguageIn=@LanguageIn({ "", "en", "de", "es", "fi", "fr", "it", "pt", "ro", "sv" })

)
public @interface Localized {

    Locale EN=locale("en");
    Locale DE=locale("de");
    Locale ES=locale("es");
    Locale FI=locale("fi");
    Locale FR=locale("fr");
    Locale IT=locale("it");
    Locale PT=locale("pt");
    Locale RO=locale("ro");
    Locale SV=locale("sv");

    Set<Locale> LOCALES=set(EN, DE, ES, FI, FR, IT, PT, RO, SV);

}
