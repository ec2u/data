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

package eu.ec2u.data._assets;

import com.metreeca.mesh.Text;
import com.metreeca.mesh.bean.jsonld.Namespace;
import com.metreeca.mesh.bean.jsonld.Property;
import com.metreeca.mesh.bean.jsonld.Type;
import com.metreeca.mesh.bean.shacl.Required;

import eu.ec2u.data._resources.Label;
import eu.ec2u.data._resources.Resource;
import org.checkerframework.checker.i18n.qual.Localized;

import java.beans.JavaBean;
import java.net.URI;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Set;

import static com.metreeca.flow.toolkits.Strings.clip;
import static com.metreeca.mesh.Text.text;
import static com.metreeca.mesh.Values.set;

@JavaBean
@Namespace("http://purl.org/dc/terms/")
@Type("ec2u:")
public interface Asset<T extends Asset<T>> extends Resource<Asset<T>> {

    int CommentLength=1000;


    @Override
    default URI getId() {
        return getPath();
    }

    @Override
    default Set<Text> getLabel() {
        return getTitle(); // !!! merge alternative / clip
    }

    @Override
    default Set<Text> getComment() {
        return set(java.util.Optional.ofNullable(getDescription()).stream() // !!! import
                .flatMap(Collection::stream)
                .map(text -> text(clip(text.string(), CommentLength), text.locale()))
        );
    }


    URI getPath(); // !!! ignore

    T setPath(URI id);


    @Required
    @Label
    Set<Text> getTitle();

    T setTitle(Set<Text> title);

    @Label
    Set<Text> getAlternative();

    T setAlternative(Set<Text> alternative);

    @Localized
    Set<Text> getDescription();

    T setDescription(Set<Text> description);


    LocalDate getCreated();

    T setCreated(LocalDate created);


    LocalDate getIssued();

    T setIssued(LocalDate issued);


    LocalDate getModified();

    T setModified(LocalDate modified);


    String getRights();

    T setRights(String rights);


    Text getAccessRights();

    T setAccessRights(Text accessRights);


    @Property("license")
    Set<License> getLicenses();

    T setLicenses(Set<License> licenses);

}
