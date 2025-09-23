/*
 * Copyright © 2025 Metreeca srl
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

import { ai, text } from "@/gcp/gemini";
import dedent from "dedent";


Promise.resolve(`

url: https://microwave.unipv.it/
title: Microwave Lab
summary: This website page serves as a news and announcements section for the Microwave Laboratory at the University of Pavia. It highlights recent activities and upcoming events, including seminar announcements on topics like brain stroke microwave imaging and microwave applications for snow monitoring, as well as a doctoral defense concerning microwave radar systems for cryosphere monitoring. The page also features updates on field research, such as glacier monitoring operations using their developed Snowave radar system. Additionally, it includes seasonal greetings and notices about past events.

url: https://microwave.unipv.it/links/
title: Useful Links – Microwave Lab
summary: This webpage serves as a directory of external resources for the Microwave Lab. It provides links to various professional societies, organizations, and institutions relevant to the field of electromagnetics and microwave engineering, offering connections to the wider academic and research community. The page also includes visual elements and a link to the lab's previous website.

url: https://microwave.unipv.it/contact-us/
title: Contact Us – Microwave Lab
summary: This page provides essential contact information for the Microwave Lab at the Department of Electrical, Computer and Biomedical Engineering. It serves as a directory to help visitors locate the lab, offering an address and directions, including a video guide for easier navigation to their H-floor location.

url: https://microwave.unipv.it/software-download/
title: Software Download – Microwave Lab
summary: This page provides access to specialized software developed by the Microwave Lab for academic and research purposes. It offers downloadable codes, including a demo version of "fss\\_unipv.exe" designed for analyzing inductive frequency selective surfaces under specific conditions. The software is linked to a published academic work and is available for use, with the researchers welcoming feedback and suggestions from users.

url: https://microwave.unipv.it/former-students/
title: Former Students – Microwave Lab
summary: This page serves as a directory for former students of the Microwave Lab at the University of Pavia. It provides a comprehensive listing of individuals who have completed their studies or research at the lab, serving as an archive and a way to maintain connections with alumni. The entries typically include information about their academic background, research interests during their time at the lab, and their subsequent career paths.

url: https://microwave.unipv.it/staff-members/
title: Staff Members – Microwave Lab
summary: This page serves as a directory for the Microwave Laboratory's staff members. It provides a comprehensive listing of individuals associated with the research unit, offering visibility into the personnel contributing to their academic and scientific endeavors. The directory details the names of the researchers, faculty, and technical staff involved in the lab's activities.

url: https://microwave.unipv.it/lodigiani-staff/
title: Lodigiani-staffmembers – Microwave Lab
summary: This page details the academic and professional background of Martina Lodigiani, a researcher at the Microwave Laboratory of the University of Pavia. It outlines her educational progression from Bachelor's to Ph.D., highlighting her research specializations in satellite communication and radar systems for cryosphere monitoring, including collaborations with international institutions. The page also lists her certifications, roles in academic governance, and past involvement in student organizations and teaching.

url: https://microwave.unipv.it/gallery/
title: Gallery – Microwave Lab
summary: This page serves as a visual archive for the Microwave Laboratory at the University of Pavia. It showcases a collection of images documenting various events, activities, and perhaps even research outcomes associated with the lab. This "gallery" acts as a repository for photographic memories, offering a glimpse into the lab's operational life and community engagement beyond formal research publications.

url: https://microwave.unipv.it/research-fields/
title: Research Fields – Microwave Lab
summary: This page outlines the key research areas and collaborations of the Microwave Laboratory. It details the lab's engagement in national and international academic and industrial partnerships focused on scientific advancement and industrial innovation. The page also lists the specialized commercial software used for electromagnetic device analysis, highlighting the lab's computational resources.

url: https://microwave.unipv.it/info-students/
title: Info for Students – Microwave Lab
summary: This page serves as a central hub for students engaging with the Microwave Laboratory at the University of Pavia. It provides essential information and resources tailored to their academic journey, including details about available research projects, thesis opportunities, and contact information for faculty and staff. The section on "Useful Links" directs students to relevant academic and administrative resources. Additionally, a "Bibliography" section offers a curated list of key publications and research papers to support their studies and research endeavors within the microwave field.

url: https://microwave.unipv.it/index.php/news-archive/
title: News archive – Microwave Lab
summary: This page serves as a news archive for the Microwave Laboratory at the University of Pavia, detailing recent events and achievements. It highlights seminar announcements featuring industry professionals and academics discussing topics like pulsed power amplifiers, mm-wave technology, and portable radar systems. The archive also documents a PhD dissertation defense, conference attendances at major international events, the launch of the laboratory's new website, and innovative research projects such as the Snowave radar system for glacier monitoring. Additionally, it includes announcements for academic year kick-offs and outreach activities like workshops for high school students.

url: https://microwave.unipv.it/old_website/
title: Microwave Lab - University of Pavia
summary: This page provides an overview of the Microwave Laboratory at the University of Pavia. It serves as a historical archive, offering insights into the lab's past research activities and structure. The site includes directories detailing the laboratory's personnel, past projects, and publications, providing a comprehensive record of its academic endeavors and contributions to the field of microwave engineering.

url: https://microwave.unipv.it/index.php/alipour-staff/
title: Alipour-staffmembers – Microwave Lab
summary: This page serves as a directory for a specific research staff member within the Microwave Lab at the University of Pavia. It provides biographical information and details the research interests and academic background of Mehdi Alipour Masoumabad. His expertise lies in the development of microwave sensor systems, encompassing microwave component design, RF circuit design, and antenna technology.

url: https://microwave.unipv.it/index.php/dimeo-staff/
title: DiMeo-staffmembers – Microwave Lab
summary: This page serves as a staff directory for the Microwave Laboratory at the University of Pavia, showcasing its research personnel. It details the academic and professional background of Simona Di Meo, a Postdoctoral Researcher. Her profile highlights her educational achievements, current research focus on early breast cancer detection, involvement in the "MULTIWAVE" BlueSky Research Project, and affiliations with professional organizations like IEEE and SIEm. The entry also lists her notable awards and recognitions, underscoring her contributions to the field.

url: https://microwave.unipv.it/index.php/staff-members/
title: Staff Members – Microwave Lab
summary: This page serves as a directory of the individuals associated with the Microwave Lab at the University of Pavia. It lists the staff members, providing a comprehensive overview of the personnel contributing to the research unit's activities.

url: https://microwave.unipv.it/index.php/bozzi-staff/
title: Bozzi-staffmembers – Microwave Lab
summary: This page profiles Professor Maurizio Bozzi, a Full Professor of Electromagnetic Fields at the University of Pavia's Department of Electrical, Computer and Biomedical Engineering. It details his academic background, extensive international research collaborations, and key research interests in computational electromagnetics and waveguide technologies. The page also highlights his significant contributions to academic publishing and editorial roles, his leadership within IEEE Microwave Theory and Technology Society, and numerous awards recognizing his research achievements. Additionally, it provides links to his teaching materials, software code, and online thesis repositories.

url: https://microwave.unipv.it/index.php/arenare-staff/
title: Arenare-staffmembers – Microwave Lab
summary: This page provides biographical and academic details for Davide Arenare, a Ph.D. student at the Microwave Lab. It outlines his educational background, including his Bachelor's and Master's degrees from the University of Pavia, and details the focus of his thesis work at both the undergraduate and graduate levels, the latter involving collaboration with the European Space Agency. The page also notes his current research involvement as a Ph.D. student at the Microwave Lab, concentrating on the design and analysis of advanced ground stations.

url: https://microwave.unipv.it/index.php/silvestri-staff/
title: Silvestri-staffmembers – Microwave Lab
summary: This page introduces Lorenzo Silvestri, a member of the Microwave Lab at the University of Pavia. It details his academic background, including his Master's degree in Electronic Engineering from the University of Pavia and his thesis work at Gent University on reconfigurable textile substrates for waveguides. The page also outlines his research experience, beginning with a post-graduate scholarship focused on novel components in Substrate Integrated Waveguide (SIW) technology, and his subsequent enrollment as a Ph.D. student at the Microwave Lab.

url: https://microwave.unipv.it/index.php/delmonte-staff/
title: Delmonte-staffmembers – Microwave Lab
summary: This webpage serves as a directory listing of staff members within the Microwave Laboratory at the University of Pavia. It provides brief biographical information and research interests for individuals associated with the lab, such as Nicolò Delmonte, a research fellow whose work focuses on SIW technology and RF circuit design.

url: https://microwave.unipv.it/index.php/pasian-staff/
title: Pasian-staffmembers – Microwave Lab
summary: This page provides detailed information about Professor Marco Pasian, an Associate Professor at the Microwave Laboratory of the University of Pavia. It outlines his academic background, professional experience including work with the European Space Agency, and significant editorial and reviewer roles for various IEEE and EuMA journals and conferences. The page highlights his research interests in microwave components and systems for space and biomedical applications, as well as his extensive involvement as Principal Investigator and Unit Leader in numerous funded research projects, particularly those focused on snowpack monitoring and biomedical imaging. It also details his teaching responsibilities and extensive experience in supervising graduate and undergraduate students.

url: https://microwave.unipv.it/index.php/perregrini-staff/
title: Perregrini-staffmembers – Microwave Lab
summary: This page provides detailed information about Luca Perregrini, an Associate Professor and head of the Microwave Laboratory at the University of Pavia. It outlines his academic background, extensive teaching experience, and significant research contributions in electromagnetics and microwave engineering. The text highlights his expertise in developing numerical methods, designing microwave components and antennas, including innovations in substrate integrated waveguides and frequency selective surfaces. It also details his numerous roles in professional societies, editorial positions for prestigious journals, and extensive conference involvement, showcasing his prominent standing in the international research community.

url: https://microwave.unipv.it/alipour-staff/
title: Alipour-staffmembers – Microwave Lab
summary: This page provides a biography for Mehdi Alipour Masoumabad, a Ph.D. student at the Microwave Lab, joining in October 2020. It details his academic background, including B.Sc. and M.Sc. degrees in Telecommunication Engineering, and outlines his current research interests within the lab, which center on microwave sensor system development, microwave component design, RF circuit design, and antennas.

url: https://microwave.unipv.it/index.php/caorsi-staff/
title: Caorsi-staffmembers – Microwave Lab
summary: This page outlines the professional profile of Salvatore Caorsi, a Full Professor at the University of Pavia, detailing his academic career, teaching responsibilities, and significant contributions to research in electromagnetic fields. It highlights his extensive work in numerical methods for electromagnetic fields, electromagnetic techniques for remote sensing and diagnostics, antenna development, biomedical applications of electromagnetism (including cancer therapy and risk assessment of electromagnetic field exposure), and electromagnetic compatibility. The page also references his involvement in founding and directing research centers and SMEs, his international collaborations, editorial roles, and coordination of national and European research projects.

url: https://microwave.unipv.it//index.php/courses/past-courses/
title: Past courses – Microwave Lab
summary: This page serves as an archive for past courses offered by the Microwave Laboratory at the University of Pavia. It provides access to course materials, syllabi, and potentially lecture notes or presentations from previous academic years, allowing students and researchers to review or retrieve information about foundational and advanced topics covered by the lab.

url: https://microwave.unipv.it/index.php/cannata-staff/
title: Cannata-staffmembers – Microwave Lab
summary: This page serves as a personnel directory for the Microwave Laboratory, specifically detailing the academic and research staff. It provides biographical and academic information for Alessia Cannata, a PhD student focusing on the development of a bi-modal imaging system for early breast cancer detection. Her background in Bioengineering and thesis work on imaging biomarkers and bi-modal breast phantoms are highlighted.

url: https://microwave.unipv.it/index.php/bressan-staff/
title: Bressan-staffmembers – Microwave Lab
summary: This page provides biographical information for Marco Bressan, a faculty member at the University of Pavia's Department of Electronics. It details his academic background, career progression as a researcher and associate professor specializing in electromagnetics, and his research interests in computational methods for microwave component design. The page also lists his professional affiliations, including memberships in IEEE and AEI, and his editorial role for the IEEE Transactions on Microwave Theory & Techniques.

url: https://microwave.unipv.it/index.php/perret-staff/
title: Perret-staffmembers – Microwave Lab
summary: This page serves as a staff directory for the Microwave Laboratory, providing information about its members. It features Paolo Perret, an executive Ph.D. student specializing in microwave techniques for cryosphere monitoring. His research, conducted in cooperation with Fondazione Montagna Sicura and the University of Pavia, aims to improve radar systems and remote sensing for glacial and periglacial process monitoring.

url: https://microwave.unipv.it/index.php/conciauro-staff/
title: Conciauro-staffmembers – Microwave Lab
summary: This page profiles Giuseppe Conciauro, a Professor Emeritus at the University of Pavia, highlighting his significant career in Microwave Theory and Techniques. It details his contributions to particle accelerators and numerical methods for electromagnetic modeling, along with his extensive publication record and authorship of key textbooks. The page also outlines his leadership roles, including directing the Department of Electronics and founding the Microwave Laboratory at the University of Pavia, where he managed numerous research projects. His extensive editorial and review activities for prominent IEEE publications and his status as a Life Fellow of the IEEE are also noted.

url: https://microwave.unipv.it/index.php/arcioni-staff/
title: Arcioni-staffmembers – Microwave Lab
summary: This page details the academic profile of Professor Paolo Arcioni, a key member of the Microwave Laboratory at the University of Pavia. It outlines his educational background, his extensive career as a researcher and professor specializing in electromagnetics and microwave theory, and his significant contributions to electromagnetic CAD for passive components and particle accelerator structures. The content also highlights his international experience, including a visiting scientist position at the Stanford Linear Accelerator Center, and his professional affiliations with IEEE and AEI.

url: https://microwave.unipv.it/index.php/anjali-staff/
title: Anjali-staffmembers – Microwave Lab
summary: This page from the Microwave Lab website details the profile of Anjali, a Ph.D. student. Her academic background includes a bachelor's degree in Electrical Engineering and a master's in Material Science, with her thesis focusing on empirical formulas for microstrip-based RF circuits. She is currently pursuing her Ph.D. at the Microwave Lab, concentrating on integrated RF and millimeter wave components for future beyond-5G networks.

`)

	.then(async input => ai().then(async ai => text(await ai.models.generateContent({
		model: "gemini-2.5-flash-lite",
		contents: JSON.stringify(input, null, 2),
		config: {
			seed: 0,
			temperature: 0,
			systemInstruction: dedent`ROLE / You are an academic content manager specializing in research activities.

INPUT / You will be provided with an annotated sitemap for a website describing an academic research unit. Each entry includes:

- the page URL
- the page title
- a page summary focusing on its role within the website

GOAL / Your task is to identify pages where the following information about the unit AS A WHOLE is likely to be found:

- general description of the research unit
- research topics and fields of the unit
- research publications from the unit
- instrumentation and other facilities, including specialised software
- links to websites for children research units

OUTPUT / Reply with a plaintext list containing a candidate page URL on each line.

CRITICAL FILTERING RULES / ALWAYS EXCLUDE pages that:

- Have URLs containing personal names or staff identifiers
- Have titles containing individual names or hints of staff membership
- Describe individual staff member profiles, biographies, or personal research activities
- Focus on student activities, courses, teaching, or educational content
- Are directories of external links or resources
- Contain news, events, announcements, or historical information
- Are archives, galleries, or past content

POSITIVE INDICATORS / PRIORITIZE pages that:

- Describe the lab's overall research areas or fields
- List institutional publications or research outputs
- Detail laboratory facilities, equipment, or software
- Provide general information about the research unit
- Contain institutional-level content rather than individual-focused content: you want pages about the RESEARCH UNIT, not about the PEOPLE in it.
`
		}
	}))))

	.then(links => links
		.split("\n")
		.filter(link => link !== "")
	)

	.then(console.info)
	.catch(console.error);
