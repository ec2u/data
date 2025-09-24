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


const microwave=`
url: https://microwave.unipv.it/
title: Microwave Lab
summary: This website page serves as a news and announcements section for the Microwave Laboratory at the University of Pavia. It highlights recent activities and upcoming events, including seminar announcements on topics like brain stroke microwave imaging and microwave applications for snow monitoring, as well as a doctoral defense concerning microwave radar systems for cryosphere monitoring. The page also features updates on field research, such as glacier monitoring operations using their developed Snowave radar system. Additionally, it includes seasonal greetings and notices about past events.

url: https://microwave.unipv.it/staff-members/
title: Staff Members – Microwave Lab
summary: This page serves as a directory for the Microwave Laboratory's staff members. It provides a comprehensive listing of individuals associated with the research unit, offering visibility into the personnel contributing to their academic and scientific endeavors. The directory details the names of the researchers, faculty, and technical staff involved in the lab's activities.

url: https://microwave.unipv.it/info-students/
title: Info for Students – Microwave Lab
summary: This page serves as a central hub for students engaging with the Microwave Laboratory at the University of Pavia. It provides essential information and resources tailored to their academic journey, including details about available research projects, thesis opportunities, and contact information for faculty and staff. The section on "Useful Links" directs students to relevant academic and administrative resources. Additionally, a "Bibliography" section offers a curated list of key publications and research papers to support their studies and research endeavors within the microwave field.

url: https://microwave.unipv.it/software-download/
title: Software Download – Microwave Lab
summary: This page provides access to specialized software developed by the Microwave Lab for academic and research purposes. It offers downloadable codes, including a demo version of "fss\_unipv.exe" designed for analyzing inductive frequency selective surfaces under specific conditions. The software is linked to a published academic work and is available for use, with the researchers welcoming feedback and suggestions from users.

url: https://microwave.unipv.it/contact-us/
title: Contact Us – Microwave Lab
summary: This page provides essential contact information for the Microwave Lab at the Department of Electrical, Computer and Biomedical Engineering. It serves as a directory to help visitors locate the lab, offering an address and directions, including a video guide for easier navigation to their H-floor location.

url: https://microwave.unipv.it/lodigiani-staff/
title: Lodigiani-staffmembers – Microwave Lab
summary: This page details the academic and professional background of Martina Lodigiani, a researcher at the Microwave Laboratory of the University of Pavia. It outlines her educational progression from Bachelor's to Ph.D., highlighting her research specializations in satellite communication and radar systems for cryosphere monitoring, including collaborations with international institutions. The page also lists her certifications, roles in academic governance, and past involvement in student organizations and teaching.

url: https://microwave.unipv.it/gallery/
title: Gallery – Microwave Lab
summary: This page serves as a visual archive for the Microwave Laboratory at the University of Pavia. It showcases a collection of images documenting various events, activities, and perhaps even research outcomes associated with the lab. This "gallery" acts as a repository for photographic memories, offering a glimpse into the lab's operational life and community engagement beyond formal research publications.

url: https://microwave.unipv.it/former-students/
title: Former Students – Microwave Lab
summary: This page serves as a directory for former students of the Microwave Lab at the University of Pavia. It provides a comprehensive listing of individuals who have completed their studies or research at the lab, serving as an archive and a way to maintain connections with alumni. The entries typically include information about their academic background, research interests during their time at the lab, and their subsequent career paths.

url: https://microwave.unipv.it/index.php/news-archive/
title: News archive – Microwave Lab
summary: This page serves as a news archive for the Microwave Laboratory at the University of Pavia, detailing recent events and achievements. It highlights seminar announcements featuring industry professionals and academics discussing topics like pulsed power amplifiers, mm-wave technology, and portable radar systems. The archive also documents a PhD dissertation defense, conference attendances at major international events, the launch of the laboratory's new website, and innovative research projects such as the Snowave radar system for glacier monitoring. Additionally, it includes announcements for academic year kick-offs and outreach activities like workshops for high school students.

url: https://microwave.unipv.it/research-fields/
title: Research Fields – Microwave Lab
summary: This page outlines the key research areas and collaborations of the Microwave Laboratory. It details the lab's engagement in national and international academic and industrial partnerships focused on scientific advancement and industrial innovation. The page also lists the specialized commercial software used for electromagnetic device analysis, highlighting the lab's computational resources.

url: https://microwave.unipv.it/links/
title: Useful Links – Microwave Lab
summary: This webpage serves as a directory of external resources for the Microwave Lab. It provides links to various professional societies, organizations, and institutions relevant to the field of electromagnetics and microwave engineering, offering connections to the wider academic and research community. The page also includes visual elements and a link to the lab's previous website.

url: https://microwave.unipv.it/index.php/perregrini-staff/
title: Perregrini-staffmembers – Microwave Lab
summary: This page provides detailed information about Luca Perregrini, an Associate Professor and head of the Microwave Laboratory at the University of Pavia. It outlines his academic background, extensive teaching experience, and significant research contributions in electromagnetics and microwave engineering. The text highlights his expertise in developing numerical methods, designing microwave components and antennas, including innovations in substrate integrated waveguides and frequency selective surfaces. It also details his numerous roles in professional societies, editorial positions for prestigious journals, and extensive conference involvement, showcasing his prominent standing in the international research community.

url: https://microwave.unipv.it/index.php/bozzi-staff/
title: Bozzi-staffmembers – Microwave Lab
summary: This page profiles Professor Maurizio Bozzi, a Full Professor of Electromagnetic Fields at the University of Pavia's Department of Electrical, Computer and Biomedical Engineering. It details his academic background, extensive international research collaborations, and key research interests in computational electromagnetics and waveguide technologies. The page also highlights his significant contributions to academic publishing and editorial roles, his leadership within IEEE Microwave Theory and Technology Society, and numerous awards recognizing his research achievements. Additionally, it provides links to his teaching materials, software code, and online thesis repositories.

url: https://microwave.unipv.it/index.php/alipour-staff/
title: Alipour-staffmembers – Microwave Lab
summary: This page serves as a directory for a specific research staff member within the Microwave Lab at the University of Pavia. It provides biographical information and details the research interests and academic background of Mehdi Alipour Masoumabad. His expertise lies in the development of microwave sensor systems, encompassing microwave component design, RF circuit design, and antenna technology.

url: https://microwave.unipv.it/index.php/dimeo-staff/
title: DiMeo-staffmembers – Microwave Lab
summary: This page serves as a staff directory for the Microwave Laboratory at the University of Pavia, showcasing its research personnel. It details the academic and professional background of Simona Di Meo, a Postdoctoral Researcher. Her profile highlights her educational achievements, current research focus on early breast cancer detection, involvement in the "MULTIWAVE" BlueSky Research Project, and affiliations with professional organizations like IEEE and SIEm. The entry also lists her notable awards and recognitions, underscoring her contributions to the field.

url: https://microwave.unipv.it/index.php/silvestri-staff/
title: Silvestri-staffmembers – Microwave Lab
summary: This page introduces Lorenzo Silvestri, a member of the Microwave Lab at the University of Pavia. It details his academic background, including his Master's degree in Electronic Engineering from the University of Pavia and his thesis work at Gent University on reconfigurable textile substrates for waveguides. The page also outlines his research experience, beginning with a post-graduate scholarship focused on novel components in Substrate Integrated Waveguide (SIW) technology, and his subsequent enrollment as a Ph.D. student at the Microwave Lab.

url: https://microwave.unipv.it/index.php/arenare-staff/
title: Arenare-staffmembers – Microwave Lab
summary: This page provides biographical and academic details for Davide Arenare, a Ph.D. student at the Microwave Lab. It outlines his educational background, including his Bachelor's and Master's degrees from the University of Pavia, and details the focus of his thesis work at both the undergraduate and graduate levels, the latter involving collaboration with the European Space Agency. The page also notes his current research involvement as a Ph.D. student at the Microwave Lab, concentrating on the design and analysis of advanced ground stations.

url: https://microwave.unipv.it/index.php/delmonte-staff/
title: Delmonte-staffmembers – Microwave Lab
summary: This webpage serves as a directory listing of staff members within the Microwave Laboratory at the University of Pavia. It provides brief biographical information and research interests for individuals associated with the lab, such as Nicolò Delmonte, a research fellow whose work focuses on SIW technology and RF circuit design.

url: https://microwave.unipv.it/index.php/anjali-staff/
title: Anjali-staffmembers – Microwave Lab
summary: This page from the Microwave Lab website details the profile of Anjali, a Ph.D. student. Her academic background includes a bachelor's degree in Electrical Engineering and a master's in Material Science, with her thesis focusing on empirical formulas for microstrip-based RF circuits. She is currently pursuing her Ph.D. at the Microwave Lab, concentrating on integrated RF and millimeter wave components for future beyond-5G networks.

url: https://microwave.unipv.it/index.php/pasian-staff/
title: Pasian-staffmembers – Microwave Lab
summary: This page provides detailed information about Professor Marco Pasian, an Associate Professor at the Microwave Laboratory of the University of Pavia. It outlines his academic background, professional experience including work with the European Space Agency, and significant editorial and reviewer roles for various IEEE and EuMA journals and conferences. The page highlights his research interests in microwave components and systems for space and biomedical applications, as well as his extensive involvement as Principal Investigator and Unit Leader in numerous funded research projects, particularly those focused on snowpack monitoring and biomedical imaging. It also details his teaching responsibilities and extensive experience in supervising graduate and undergraduate students.

url: https://microwave.unipv.it/index.php/cannata-staff/
title: Cannata-staffmembers – Microwave Lab
summary: This page serves as a personnel directory for the Microwave Laboratory, specifically detailing the academic and research staff. It provides biographical and academic information for Alessia Cannata, a PhD student focusing on the development of a bi-modal imaging system for early breast cancer detection. Her background in Bioengineering and thesis work on imaging biomarkers and bi-modal breast phantoms are highlighted.

url: https://microwave.unipv.it/index.php/perret-staff/
title: Perret-staffmembers – Microwave Lab
summary: This page serves as a staff directory for the Microwave Laboratory, providing information about its members. It features Paolo Perret, an executive Ph.D. student specializing in microwave techniques for cryosphere monitoring. His research, conducted in cooperation with Fondazione Montagna Sicura and the University of Pavia, aims to improve radar systems and remote sensing for glacial and periglacial process monitoring.

url: https://microwave.unipv.it/index.php/arcioni-staff/
title: Arcioni-staffmembers – Microwave Lab
summary: This page details the academic profile of Professor Paolo Arcioni, a key member of the Microwave Laboratory at the University of Pavia. It outlines his educational background, his extensive career as a researcher and professor specializing in electromagnetics and microwave theory, and his significant contributions to electromagnetic CAD for passive components and particle accelerator structures. The content also highlights his international experience, including a visiting scientist position at the Stanford Linear Accelerator Center, and his professional affiliations with IEEE and AEI.

url: https://microwave.unipv.it/old_website/
title: Microwave Lab - University of Pavia
summary: This page provides an overview of the Microwave Laboratory at the University of Pavia. It serves as a historical archive, offering insights into the lab's past research activities and structure. The site includes directories detailing the laboratory's personnel, past projects, and publications, providing a comprehensive record of its academic endeavors and contributions to the field of microwave engineering.

url: https://microwave.unipv.it/alipour-staff/
title: Alipour-staffmembers – Microwave Lab
summary: This page provides a biography for Mehdi Alipour Masoumabad, a Ph.D. student at the Microwave Lab, joining in October 2020. It details his academic background, including B.Sc. and M.Sc. degrees in Telecommunication Engineering, and outlines his current research interests within the lab, which center on microwave sensor system development, microwave component design, RF circuit design, and antennas.

url: https://microwave.unipv.it/index.php/caorsi-staff/
title: Caorsi-staffmembers – Microwave Lab
summary: This page outlines the professional profile of Salvatore Caorsi, a Full Professor at the University of Pavia, detailing his academic career, teaching responsibilities, and significant contributions to research in electromagnetic fields. It highlights his extensive work in numerical methods for electromagnetic fields, electromagnetic techniques for remote sensing and diagnostics, antenna development, biomedical applications of electromagnetism (including cancer therapy and risk assessment of electromagnetic field exposure), and electromagnetic compatibility. The page also references his involvement in founding and directing research centers and SMEs, his international collaborations, editorial roles, and coordination of national and European research projects.

url: https://microwave.unipv.it//index.php/courses/past-courses/
title: Past courses – Microwave Lab
summary: This page serves as an archive for past courses offered by the Microwave Laboratory at the University of Pavia. It provides access to course materials, syllabi, and potentially lecture notes or presentations from previous academic years, allowing students and researchers to review or retrieve information about foundational and advanced topics covered by the lab.

url: https://microwave.unipv.it/index.php/bressan-staff/
title: Bressan-staffmembers – Microwave Lab
summary: This page provides biographical information for Marco Bressan, a faculty member at the University of Pavia's Department of Electronics. It details his academic background, career progression as a researcher and associate professor specializing in electromagnetics, and his research interests in computational methods for microwave component design. The page also lists his professional affiliations, including memberships in IEEE and AEI, and his editorial role for the IEEE Transactions on Microwave Theory & Techniques.

url: https://microwave.unipv.it/index.php/conciauro-staff/
title: Conciauro-staffmembers – Microwave Lab
summary: This page profiles Giuseppe Conciauro, a Professor Emeritus at the University of Pavia, highlighting his significant career in Microwave Theory and Techniques. It details his contributions to particle accelerators and numerical methods for electromagnetic modeling, along with his extensive publication record and authorship of key textbooks. The page also outlines his leadership roles, including directing the Department of Electronics and founding the Microwave Laboratory at the University of Pavia, where he managed numerous research projects. His extensive editorial and review activities for prominent IEEE publications and his status as a Life Fellow of the IEEE are also noted.

url: https://microwave.unipv.it/index.php/staff-members/
title: Staff Members – Microwave Lab
summary: This page serves as a directory of the individuals associated with the Microwave Lab at the University of Pavia. It lists the staff members, providing a comprehensive overview of the personnel contributing to the research unit's activities.
`;

const biology=`
url: https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale
title: Biologia Vegetale
summary: This page details the plant biology research activities at the DBB department, covering both basic and applied research on model plants and agriculturally significant species. It highlights three distinct laboratories: the Plant Biotechnology Lab, focusing on biochemical, genetic, and molecular aspects; the Seed Molecular Physiology Lab, investigating seed development and germination; and the BioPhotoLab, likely exploring plant photobiology. Each lab's description includes its head researcher and collaborators, with links to further information.

url: https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/laboratorio-di-biotecnologie-vegetali
title: Laboratorio di Biotecnologie vegetali
summary: This page details the research activities of the Plant Biotechnology Laboratory, a unit within the Department of Biology and Biotechnology at the University of Pavia. The laboratory focuses on three main research areas: understanding DNA Damage Response (DDR) in plants under genotoxic stress, investigating the role of microRNAs in DDR and cross-kingdom transfer, and developing non-invasive methods for seed quality assessment. The page also lists the plant species and methodologies employed, alongside extensive national and international collaborations.

url: https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/biophotolab
title: BioPhotoLab
summary: This page describes the BioPhotoLab, a research unit within the Department of Biology and Biotechnology at the University of Pavia. The lab's research focuses on the molecular physiology of abiotic stress responses in photosynthetic organisms, including higher plants, mosses, and unicellular algae. Their multidisciplinary approach integrates genetics (using techniques like homologous recombination, *Agrobacterium tumefaciens* transformation, and CRISPR-Cas9), biochemistry and molecular biology (involving organelle purification, HPLC, protein electrophoresis, and protein expression), and physiology (through fluorescence and absorption measurements).

url: https://dbb.dip.unipv.it/it/ricerca/tematiche-di-ricerca-e-laboratori/biologia-vegetale/seed-molecular-physiology-lab
title: “Seed Molecular Physiology” Lab
summary: This page details the research activities of the "Seed Molecular Physiology" Lab at the University of Pavia. The lab focuses on two main areas: pre-germinative metabolism, investigating how DNA damage response mechanisms impact seed quality and vigor, and seed priming, exploring basic and applied research to develop molecular indicators for early seed quality diagnosis and priming response monitoring. The research employs advanced molecular techniques, including high-throughput analyses, and collaborates with national and international institutions and agricultural industries.

`;

const power=`
url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/
title: Institut für Elektrische Antriebe und Leistungselektronik
summary: This page introduces the Institute of Electric Drives and Power Electronics at Johannes Kepler University Linz. It outlines the institute's history, established in 1994 and evolving into its current form in 2004. The page details the institute's core competencies in electric drives, small motors, magnetic bearing technology, and drive electronics. It also provides essential contact information, including the institute's address, location within the Science Park, head of the institute, secretarial office hours, phone number, and email address, along with a link to its English version.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/ueber-uns/
title: Über uns
summary: This page provides an overview of the Institute for Electrical Drives and Power Electronics at JKU. It traces the institute's origins from the establishment of Mechatronics studies at JKU in 1990, highlighting its role in founding numerous research institutes and competence centers like LCM. The summary details the institute's core competencies in electrical drives, magnetic bearings, and power electronics, emphasizing its significant contributions to research projects and the development of numerous patents. It also touches upon its involvement in regional development initiatives and the establishment of a sister institute focused on smart actuators.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/anfahrt/
title: Anfahrt
summary: This page provides comprehensive directions to the Institute for Electrical Drives and Power Electronics at Johannes Kepler University Linz. It details how to reach the institute by car from various directions, by train from Linz main station, and by plane via Linz/Hörsching airport. Additionally, it lists the institute's postal and physical addresses, secretariat opening hours, contact telephone and fax numbers, and email address, along with visitor parking information for the Science Park 1 underground garage.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/forschung/publikationen/
title: Publikationen
summary: This page serves as a gateway to the research output of the Institute of Electrical Drives and Power Electronics. It directs users to "Pure," an external platform that functions as a comprehensive repository for the institute's publications. This catalogue allows for the discovery and retrieval of scholarly works, providing access to the research contributions of the institute's members.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/lehre/masterarbeiten/
title: Masterarbeiten
summary: This page from the Institute for Electrical Drives and Power Electronics at JKU provides essential information for students undertaking their Master's thesis. It outlines the admission requirements, detailing the necessary ECTS credits from completed coursework. The page also explains the structure of the Master's thesis and seminar, emphasizing the written component of the seminar and the presentation-based progress tracking for the thesis itself. Crucially, it directs students to a continuously updated PDF document listing currently available thesis topics, encouraging them to consult with supervisors for specific assignments.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/stellenangebote/
title: Stellenangebote
summary: This page serves as a recruitment portal for the Institute of Electrical Drives and Power Electronics at JKU. It outlines the types of positions available, specifically seeking scientific project staff and university assistants. The institute is looking for individuals with expertise or interest in electrical drive technology, smart actuators, power electronics, and control engineering, emphasizing the need for professionals to develop, research, and test new technologies before market introduction. Interested candidates are invited to submit their applications via email.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/lehre/repositorium/
title: Repositorium
summary: This page serves as a repository for the Institute of Electrical Drives and Power Electronics at JKU. It provides students with access to past examination papers and practice tests to aid in their preparation for course assessments. The materials are intended as a guide and do not represent the complete scope of examination content for each subject.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/
title: Team
summary: This page serves as a directory for the Institute of Electrical Drives and Power Electronics at JKU. It lists the institute's personnel, categorized by their roles, including the Director, Deputy Directors, Assistants, Secretariat, Accounting, Technicians, and Scientific Staff. Each entry provides contact information such as name, office location, phone extension, and email address, facilitating communication with the institute's members.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/lehre/aktuelle-kurse/
title: Aktuelle Kurse
summary: This page serves as a directory for current courses offered by the Institute of Electrical Drives and Power Electronics. It provides a structured listing of courses, detailing their identification codes, titles, subtitles, registration links, types, weekly hours, instructors, and scheduling rhythms. The information is presented in a tabular format, with options to expand or collapse details for each course, facilitating easy access to essential information for students and faculty.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/lehre/bachelorarbeiten/
title: Bachelorarbeiten
summary: This page from the Institute for Electrical Drives and Power Electronics at JKU provides essential information for students undertaking their Bachelor's thesis. It outlines the prerequisites for registration, including a minimum of 80 ECTS credits from core subjects, and details the process for completing and submitting the written thesis within the enrolled semester. The page also directs students to a continuously updated PDF document listing currently available thesis topics, emphasizing that specific topic assignment is arranged through consultation with a supervisor. Submission deadlines for both summer and winter semesters are clearly stated, along with the assessment structure involving interim and final presentations.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/lehre/studienangebot/
title: Studienangebot
summary: This page outlines the study offerings in electrical drive technology and power electronics at the JKU's Institute for Electrical Drives and Power Electronics. It details the Bachelor's and Master's programs, emphasizing the integration of electrical drives as a core component. The content covers foundational knowledge, design principles, and advanced control techniques for various motor types, complemented by power electronics courses. The page also provides access to introductory lecture materials and presents comprehensive tables listing available courses for both Bachelor's and Master's degrees, including their ECTS credits and semester offerings.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/forschung/erc-forschung/
title: ERC Forschung
summary: This page provides information about the ERC research activities of the Institute of Electrical Drives and Power Electronics. It specifically highlights the ERC Starting Grant project CHARMAELEON and directs users to the English version of the institute's website for further details.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/dobler/
title: Dobler
summary: This page provides information about DI Christoph Dobler, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a personal profile page within the institute's website, detailing his professional contributions. The page links to his publications, lectures, research projects, short scientific contributions, and innovations, offering a comprehensive overview of his academic and research activities.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/marth/
title: Marth
summary: This page provides information about DI Dr. Edmund Marth, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a directory of his academic contributions, linking to his publications, lectures, research projects, short scientific contributions, and innovations.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/gruber/
title: Gruber
summary: This page provides information about Univ.-Prof. DI Dr. Wolfgang Gruber, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic profile, including his publications, lectures, research projects, short scientific contributions, and innovations. The page acts as a directory to his scholarly output and professional activities within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/gruber-ch/
title: Gruber Ch.
summary: This page provides administrative contact information for Christine Gruber at the Institute for Electrical Drives and Power Electronics. It includes her office location, phone numbers, and email address. Links are also provided to access her publications, lectures, research projects, short scientific contributions, innovations, and other academic activities.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/varvolik/
title: Varvolik
summary: This page provides information about Vasyl Varvolik, Ph.D., a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, research projects, short scientific contributions, and innovations. The page acts as a directory to his scholarly output and professional activities within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/
title: News & Events
summary: This page serves as a news and events hub for the Institute for Electrical Drives and Power Electronics. It features recent announcements, including awards for scientific outreach, research project launches, participation in conferences and public events, and staff achievements in both academic and sporting activities. The content highlights the institute's engagement with the wider community and its contributions to research and education.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/klambauer/
title: Klambauer
summary: This page provides administrative contact information for Claudia Klambauer at the Institute for Electrical Drives and Power Electronics. It includes her office location, phone numbers, and email address. Links are also provided to sections detailing her publications, lectures, research projects, short scientific contributions, innovations, and other relevant academic activities.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/bramerdorfer/
title: Bramerdorfer
summary: This page provides detailed information about Univ.-Prof. DI Dr. Gerd Bramerdorfer, a member of the academic team at the Institute for Electrical Drives and Power Electronics. It serves as a central point for accessing his professional profile, including a downloadable curriculum vitae. The page also acts as a gateway to his scholarly output, offering links to his publications, lectures, research projects, and innovations, thereby showcasing his contributions to the institute's research activities.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/mallinger/
title: Mallinger
summary: This page provides detailed contact information and professional background for DI Stefan Mallinger, a University Assistant at the Institute for Electrical Drives and Power Electronics. It serves as a personal profile page within the institute's website, offering direct contact details, office location, and links to his research profile, ORCID, and lists of his publications, lectures, research projects, and innovations.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/mueller/
title: Müller
summary: This page provides contact and location details for Gertraud Müller, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a directory entry for an individual within the institute's team, offering her contact information, office location, and links to her professional contributions including publications, lectures, research projects, and innovations.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/goldbeck/
title: Goldbeck
summary: This page provides information about DI Gereon Goldbeck, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including a list of his publications, lectures he has delivered, research projects he is involved in, his short biography, and any innovations he has contributed.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/somer/
title: Somer
summary: This page provides contact information and professional details for Idil Somer, a technician at the Institute for Electrical Drives and Power Electronics. It serves as a directory entry within the institute's website, offering direct contact methods and links to her contributions in publications, lectures, research projects, and innovations.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/proell/
title: Pröll
summary: This page provides information about DI Andreas Pröll, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a profile page within the institute's website, detailing his contributions and activities. The content is organized into sections that highlight his publications, lectures, research projects, short scientific contributions, and innovations, offering a comprehensive overview of his academic and research work.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/woeckinger/
title: Wöckinger
summary: This page provides information about DI Daniel Wöckinger, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, and involvement in research projects. The page also highlights his contributions to innovation and provides a link to his short profile.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/dirnberger/
title: Dirnberger
summary: This page provides information about DI Peter Dirnberger, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, research projects, and innovations. The page also links to his short biography and potentially other relevant academic information.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/weissitsch/
title: Weissitsch
summary: This page provides information about DI Gabriel Weissitsch, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, research projects, and innovations. The page also links to his involvement in SCS (likely a specific research area or group) and any relevant patents or intellectual property.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/zorn/
title: Zorn
summary: This page provides information about DI Patrick Zorn, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, and involvement in research projects. The page also highlights his contributions to innovation and provides a brief overview of his academic profile.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/strasser/
title: Strasser
summary: This page provides contact information and professional details for Gerhard Strasser, a technician at the Institute for Electrical Drives and Power Electronics at JKU. It serves as a directory entry for a specific team member, offering his office location, phone numbers, and email address. The page also links to his contributions and activities within the institute, including his publications, lectures, research projects, and innovations.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/torabi-shahbaz/
title: Torabi_Shahbaz
summary: This page provides information about Mohammad Torabi Shahbaz, MSc., a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, and involvement in research projects. The page also details his contributions to scientific computing and innovations, offering a comprehensive overview of his work and expertise within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/koll/
title: Koll
summary: This page provides information about DI Martin Koll, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic profile, detailing his publications, lectures, research projects, short scientific contributions, and innovations. The page acts as a directory to his scholarly output and professional activities within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/afrandideh/
title: Afrandideh
summary: This page provides information about Saeed Afrandideh, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, research projects, short scientific contributions, and innovations. The page acts as a directory to his scholarly output and professional activities within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/eal-mitarbeiter-ueberzeugen-bei-der-epnc-2024-in-portoroz-18-21062024/
title: EAL Mitarbeiter überzeugen bei der EPNC 2024 in Portorož (18.-21.06.2024)
summary: This page from the Institute for Electrical Drives and Power Electronics website highlights the successful participation of its staff at the EPNC 2024 conference in Portorož. It specifically mentions DI Martin Koll receiving the Best Paper Award and Mohammad Torabi Shabhaz presenting his work, which generated significant interest and discussion among attendees. The news item celebrates these achievements and contributions to the conference.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/krainer/
title: Krainer
summary: This page provides information about DI Thomas Krainer, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a central point for accessing his academic contributions, including his publications, lectures, research projects, and innovations. The page also links to his short biography and any relevant innovations he has been involved in, offering a comprehensive overview of his work within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/neues-forschungsprojekt-am-institut-fuer-elektrische-antriebe-und-leistungselektronik-advanced-technologies-for-fuel-cell-subsystem-compressors/
title: Neues Forschungsprojekt am Institut für Elektrische Antriebe und Leistungselektronik: "Advanced technologies for fuel cell subsystem compressors"
summary: The Institute for Electrical Drives and Power Electronics is announcing a new research project focused on "Advanced technologies for fuel cell subsystem compressors," funded by the Technology Agency of the Czech Republic. This initiative aims to develop next-generation, rare-earth-free compressors for fuel cell systems, enhancing their efficiency and performance. The project also explores the implementation of bearingless technologies to further improve compressor capabilities. This four-year project involves collaboration with Garrett Motion and the Brno University of Technology, with Professor Wolfgang Gruber leading the research team.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/ueber-uns/team/peer/
title: Peer
summary: This page provides information about DI Markus Peer, a member of the Institute for Electrical Drives and Power Electronics at JKU. It serves as a directory entry for him, linking to his publications, lectures, research projects, short scientific contributions, and innovations. The content aims to offer a comprehensive overview of his academic and research activities within the institute.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/institutswanderung-auf-den-traunstein/
title: Institutswanderung auf den Traunstein
summary: This page details a recent institute hike undertaken by the Institute for Electrical Drives and Power Electronics. It serves as a news item, documenting a specific event for the institute's community. The content focuses on the successful completion of a challenging hike to the Traunstein summit, emphasizing the participants' perseverance, the rewarding views, and the positive group dynamics despite adverse weather conditions.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/doppelte-auszeichnung-fuer-di-dr-florian-poltschak-kepler-award-fuer-wissenschaftsvermittlung-in-der-kategorie-vermittlungsarbeit-fuer-kinder-und-jugendliche-und-sonderpreis-wissenschaftsvermittler-des-jahres/
title: Doppelte Auszeichnung für DI Dr. Florian Poltschak bei den Kepler Awards für Wissenschaftsvermittlung
summary: This page from the Institute for Electrical Drives and Power Electronics highlights the dual recognition of DI Dr. Florian Poltschak at the Kepler Awards for Science Communication. It details his achievement of winning both the award for "Educational Work for Children and Youth" and the special prize for "Science Communicator of the Year." The content emphasizes his volunteer work in engaging approximately 1,000 children in intelligent drive systems through creative, age-appropriate methods during events like JKU Science Holidays and the Long Night of Research, aiming to foster early interest in technology and science. The page also includes links to related news articles featuring other award recipients.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/?tx_news_pi1%5B%40widget_0%5D%5BcurrentPage%5D=2&cHash=06063c3c8d5eefd5f0aad87636c93f03#news-anchor
title: News & Events
summary: This page serves as a news and events archive for the Institute of Electrical Drives and Power Electronics at JKU. It features a chronological listing of past activities, including workshops, industry excursions, academic lectures, conference participations, and student events. The entries provide brief descriptions and links to more detailed information about each occurrence, showcasing the institute's engagement in research, education, and industry collaboration.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/das-institut-fuer-elektrische-antriebe-und-leistungselektronik-bei-der-langen-nacht-der-forschung-2024/
title: Das Institut für Elektrische Antriebe und Leistungselektronik bei der Langen Nacht der Forschung 2024
summary: This page details the participation of the Institute for Electrical Drives and Power Electronics at the "Long Night of Research 2024." It highlights their exhibit, which aimed to explain the functionality and applications of magnetically levitated motors to the public. The institute expresses gratitude to visitors and anticipation for future events, emphasizing their role in showcasing future technologies.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/jku-campus-run-2024-und-mechatronik-fussballturnier-eal-laeuft-und-schiesst-daneben/
title: JKU Campus Run 2024 und Mechatronik Fußballturnier: EAL läuft und schießt daneben.
summary: This page details the participation of the Institute for Electrical Drives and Power Electronics (EAL) in the JKU Campus Run and a subsequent Mechatronics Football Tournament. It highlights the institute's multiple teams in the relay race, celebrating a third-place finish in the mixed-team category. The page then humorously recounts the football team's performance, drawing parallels between on-field challenges and the optimization required in electrical drive technology, concluding with a lighthearted assessment of the team's need for improved coordination.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/auf-die-daube-fertig-los-team-eal-beim-mechatronik-eisstockturnier/
title: Auf die Daube fertig los: Team EAL beim Mechatronik Eisstockturnier
summary: This page reports on the participation of the "EAL-Haubentaucher" team from the Institute for Electrical Drives and Power Electronics at the Mechatronics Ice Stock Tournament. It details the team members and their performance, noting their elimination in the group stage despite a strong effort. The article highlights the event as a fun experience and expresses the team's commitment to a more successful participation in the following year.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/interview-mit-prof-gerd-bramerdorfer-im-mc-report/
title: Interview mit Prof. Gerd Bramerdorfer im MC Report
summary: This page from the Institute for Electrical Drives and Power Electronics website features an interview with Prof. Gerd Bramerdorfer. It highlights his insights on the challenges and opportunities in optimizing electrical drive systems, the integration of social and ecological considerations in new developments, his research goals supported by an ERC Starting Grant, and the societal impact of his work. The interview also touches upon industry collaborations and the "Charmaeleon" project, offering a glimpse into the future of mechatronics at JKU.

url: https://www.jku.at/institut-fuer-elektrische-antriebe-und-leistungselektronik/news-events/detail/news/vote-your-prof-wettbewerb-praemiert-herausragende-lehre-2-platz-fuer-prof-gruber-vom-institut-fuer-elektrische-antriebe-und-leistungselektronik/
title: "Vote Your Prof" Wettbewerb prämiert herausragende Lehre
summary: This news item from the Institute for Electrical Drives and Power Electronics highlights the recognition of outstanding teaching through the "Vote Your Prof" competition. Approximately 500 students participated in this initiative, organized by the Austrian National Union of Students, to honor their favorite professors. Professor Wolfgang Gruber from the institute secured second place within the Faculty of Engineering and Natural Sciences for the Winter Semester 2023/24, a significant achievement given the faculty's diverse student distribution. The institute expresses gratitude to the students and congratulates Professor Gruber on this award.
`;


Promise.resolve(
		// microwave
		biology
		// power
	)

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
- entry points to sub-laboratories, research lines, or specialized facilities within the unit
- contact information

You want information about the RESEARCH UNIT, NOT about individual researchers or their personal work: pages describing
staff profiles and individual research topics and activities ARE STRICTLY FORBIDDEN.

DO SELECT pages that describe specific laboratories, research groups, research lines, or facilities as institutional
entities, even if they are sub-units of the main research unit.

OUTPUT / Reply with a plaintext list containing a candidate page URL on each line.

ABSOLUTE EXCLUSIONS / NEVER SELECT pages that:

- Have URLs or titles indicating individual staff members (personnel identifiers, role designators, or personal names)
- Have URLs or titles indicating historical or archived content (temporal qualifiers or archive designators)
- Describe individual staff member profiles, biographies, or personal research activities 
- Describe archival content, galleries, past activities, historical information, or old website versions
- Focus on student activities, courses, teaching, or educational content
- Are directories of external links or resources
- Contain news, events, announcements, or historical information

POSITIVE INDICATORS / PRIORITIZE pages that:

- Describe the lab's overall research areas or fields
- List institutional publications or research outputs
- Detail laboratory facilities, equipment, or software
- Provide general information about the research unit
- Describe specific named laboratories, research groups research lines or other children units as institutional entities
- Contain institutional-level content rather than individual-focused content: you want pages about the RESEARCH UNIT,
  not about the PEOPLE in it.
`
		}
	}))))

	.then(links => links
		.split("\n")
		.filter(link => link !== "")
	)

	.then(console.info)
	.catch(console.error);
