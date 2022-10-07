/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.terms;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Values.iri;

public final class ISCED2011 {

    public static final IRI Scheme=iri(EC2U.concepts, "/isced-2011/");


    public static final IRI Level0=iri(Scheme, "0");
    public static final IRI Level1=iri(Scheme, "1");
    public static final IRI Level2=iri(Scheme, "2");
    public static final IRI Level3=iri(Scheme, "3");
    public static final IRI Level4=iri(Scheme, "4");
    public static final IRI Level5=iri(Scheme, "5");
    public static final IRI Level6=iri(Scheme, "6");
    public static final IRI Level7=iri(Scheme, "7");
    public static final IRI Level8=iri(Scheme, "8");
    public static final IRI Level9=iri(Scheme, "9");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private ISCED2011() { }

}
