/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.schemas;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Map;
import java.util.stream.Stream;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;

import static java.util.Collections.unmodifiableMap;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

public final class EC2U {

	public static final String Base="https://data.ec2u.eu/";
	public static final String Name=Base+"terms#";


	//// Contexts //////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI ontologies=iri(Base, "/ontologies/");
	public static final IRI universities=iri(Base, "/universities/");


	//// Vocabulary ////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final IRI Resource=iri(Name, "Resource");
	public static final IRI University=iri(Name, "University");

	public static final IRI university=iri(Name, "university");
	public static final IRI schac=iri(Name, "schac");


	//// Master Map ////////////////////////////////////////////////////////////////////////////////////////////////////

	public static final Map<String, Frame> Universities=unmodifiableMap(Stream.of(

			frame(iri("https://data.ec2u.eu/universities/1")).set(RDF.TYPE).value(University)

					.set(schac).value(literal("uc.pt"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q368643"))

					.set(RDFS.LABEL).value(literal("University of Coimbra"))
					.set(RDFS.COMMENT).value(literal("Focused on the future and recognized as major promoter of change,"
					+" the University of Coimbra has more than 7 centuries of experience in the creation and "
					+"dissemination of knowledge, culture, science and technology through study, teaching, "
					+"cutting-edge research and innovation in the most diverse areas of knowledge.")),

			frame(iri("https://data.ec2u.eu/universities/2")).set(RDF.TYPE).value(University)

					.set(schac).value(literal("uaic.ro"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q1523902"))

					.set(RDFS.LABEL).value(literal("University of Iasi"))
					.set(RDFS.COMMENT).value(literal("Alexandru Ioan Cuza University of Iasi, the first modern "
					+"university founded in Romania (in 1860), is constantly ranked 1 – 3 among Romanian universities "
					+"in terms of research, education and institutional transparency. With about 23000 students and "
					+"2000 full-time staff in its 15 faculties, our university’s academic offer includes 80 degrees at"
					+" bachelor level (4 in English, 1 in French), 116 master level programmes (14 in English, 1 in "
					+"French) and 27 fields of study at the doctoral level (all offered in English as well).")),

			frame(iri("https://data.ec2u.eu/universities/3")).set(RDF.TYPE).value(University)

					.set(schac).value(literal("uni-jena.de"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q154561"))

					.set(RDFS.LABEL).value(literal("University of Jena"))
					.set(RDFS.COMMENT).value(literal("Founded in 1558, the Friedrich Schiller University Jena is one of"
					+" the oldest universities in Germany. Once the centre of German philosophical thought, it has "
					+"become a broad-based, research-intensive institution with a global reach and a thriving "
					+"international community of more than 18,000 undergraduate and postgraduate students from over "
					+"110 countries worldwide.")),

			frame(iri("https://data.ec2u.eu/universities/4")).set(RDF.TYPE).value(University)
					.set(schac).value(literal("unipv.it"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q219317"))
					.set(RDFS.LABEL).value(literal("University of Pavia"))
					.set(RDFS.COMMENT).value(literal("The University of Pavia (UNIPV) is one of the world’s oldest  "
					+"academic institutions : it was founded in 1361 and until the 20th century it was The only "
					+"University in the Milan Area and the region of Lombardy.")),

			frame(iri("https://data.ec2u.eu/universities/5")).set(RDF.TYPE).value(University)
					.set(schac).value(literal("univ-poitiers.fr"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q661056"))
					.set(RDFS.LABEL).value(literal("University of Poitiers"))
					.set(RDFS.COMMENT).value(literal("Founded in 1431, the University of Poitiers is a "
					+"multidisciplinary university which enrols 29 000 students, 4200 of which are international "
					+"students from 120 different countries, supervised by 2700 staff members (administrative, "
					+"teaching staff and researchers). Poitiers ranks 2nd in the overall ranking of major student "
					+"cities in France in 2018-2019 and  is above the national average with 16% of foreign students.")),

			frame(iri("https://data.ec2u.eu/universities/6")).set(RDF.TYPE).value(University)

					.set(schac).value(literal("usal.es"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q308963"))

					.set(RDFS.LABEL).value(literal("University of Salamanca"))
					.set(RDFS.COMMENT).value(literal("The University of Salamanca was founded in 1218 and is one of the"
					+" three oldest universities in Europe, boasting a wide range of Faculties and Research Institutes"
					+" in Sciences and Arts. In 2011, it was awarded the Campus of International Excellence status. It"
					+" is the university of reference in its region and beyond (Castile and León) and the “Alma Mater”"
					+" of nearly all historical Latin American universities.")),

			frame(iri("https://data.ec2u.eu/universities/7")).set(RDF.TYPE).value(University)

					.set(schac).value(literal("utu.fi"))
					.set(OWL.SAMEAS).value(iri("http://www.wikidata.org/entity/Q501841"))

					.set(RDFS.LABEL).value(literal("University of Turku"))
					.set(RDFS.COMMENT).value(literal("The University of Turku (UTU) is an international research "
					+"university and an active academic community of 25,000 students and staff members from over 100 "
					+"different countries.  The University’s main campus is located in the historical city centre of "
					+"Turku – close to the unique nature and archipelago of Southwest Finland. As one of the leading "
					+"universities in Finland, the University of Turku offers study and research opportunities in "
					+"seven faculties and seven special units. Thanks to the outstanding services, compact campus and "
					+"active academic society, international students and scholars feel at home from the very "
					+"beginning of their stay at the University of Turku, Finland!"))

	).collect(toMap(frame -> frame.get(schac).value(Values::string).orElse(""), identity())));


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private EC2U() {}

}
