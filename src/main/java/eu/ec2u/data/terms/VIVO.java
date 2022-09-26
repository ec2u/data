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

/**
 * VIVO RDF vocabulary.
 *
 * @see <a href="https://bioportal.bioontology.org/ontologies/VIVO/">VIVO Ontology for Researcher Discovery</a>
 */
public final class VIVO {

    public static final String Namespace="http://vivoweb.org/ontology/core#";


    /**
     * Creates a term in the vivo namespace.
     *
     * @param id the identifier of the term to be created
     *
     * @return the schema.org term identified by {@code id}
     *
     * @throws NullPointerException if {@code id} is null
     */
    public static IRI term(final String id) {

        if ( id == null ) {
            throw new NullPointerException("null id");
        }

        return iri(Namespace, id);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI Course=term("Course");


    //// Organizations /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI AcademicDepartment=term("AcademicDepartment");
    public static final IRI Association=term("Association");
    public static final IRI Center=term("Center");
    public static final IRI ClinicalOrganization=term("ClinicalOrganization");
    public static final IRI College=term("College");
    public static final IRI Company=term("Company");
    public static final IRI Consortium=term("Consortium");
    public static final IRI CoreLaboratory=term("CoreLaboratory");
    public static final IRI Department=term("Department");
    public static final IRI Division=term("Division");
    public static final IRI ExtensionUnit=term("ExtensionUnit");
    public static final IRI Foundation=term("Foundation");
    public static final IRI FundingOrganization=term("FundingOrganization");
    public static final IRI GovernmentAgency=term("GovernmentAgency");
    public static final IRI Hospital=term("Hospital");
    public static final IRI Institute=term("Institute");
    public static final IRI Laboratory=term("Laboratory");
    public static final IRI Library=term("Library");
    public static final IRI Museum=term("Museum");
    public static final IRI PrivateCompany=term("PrivateCompany");
    public static final IRI Program=term("Program");
    public static final IRI Publisher=term("Publisher");
    public static final IRI ResearchOrganization=term("ResearchOrganization");
    public static final IRI School=term("School");
    public static final IRI ServiceProvidingLaboratory=term("ServiceProvidingLaboratory");
    public static final IRI StudentOrganization=term("StudentOrganization");
    public static final IRI University=term("University");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private VIVO() { }

}
