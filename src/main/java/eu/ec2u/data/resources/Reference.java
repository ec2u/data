
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

package eu.ec2u.data.resources;

import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.link.Frame.ID;
import static com.metreeca.link.Shape.*;

public final class Reference {

    public static Shape Reference() {
        return shape(

                property("id", ID),

                property(RDFS.LABEL, required(), local()),
                property(RDFS.COMMENT, optional(), local())

        );
    }

}
