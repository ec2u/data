/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.IRIType;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Link.link;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

import static eu.ec2u.data.terms.EC2U.multilingual;


public final class Universities extends Delegator {


    public static Shape University() {
        return relate(

                filter(clazz(EC2U.University)),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual()),

                field(EC2U.schac, required(), datatype(XSD.STRING)),
                field(EC2U.image, optional(), datatype(IRIType)),

                link(OWL.SAMEAS,

                        field(EC2U.country, optional(),
                                field(RDFS.LABEL, optional(), multilingual())
                        ),

                        detail(

                                field(EC2U.location, optional(),
                                        field(RDFS.LABEL, optional(), multilingual())
                                ),

                                field(WGS84.LAT, optional(), datatype(XSD.DECIMAL)),
                                field(WGS84.LONG, optional(), datatype(XSD.DECIMAL)),

                                field(EC2U.inception, optional(), datatype(XSD.DATETIME)),
                                field(EC2U.students, optional(), datatype(XSD.DECIMAL))
                        )

                )

        );
    }


    public Universities() {
        delegate(driver(University()).wrap(router()

                .path("/", router()
                        .get(relator())
                )

                .path("/{id}", router()
                        .get(relator())
                )

        ));
    }

}