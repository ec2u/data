/***********************************************************************************************************************
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
 **********************************************************************************************************************/

package eu.ec2u.data.cities;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.open.actions.Wikidata.wd;


public final class Pavia {

    public static final IRI University=EC2U.item("/universities/pavia");
    public static final IRI City=wd("Q6259");
    public static final IRI Country=wd("Q38");
    public static final String Language="it";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Pavia() { }

}
